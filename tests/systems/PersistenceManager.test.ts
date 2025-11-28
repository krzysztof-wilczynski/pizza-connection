
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistenceManager } from '../../src/systems/PersistenceManager';
import { GameState } from '../../src/model/GameState';
import { Restaurant } from '../../src/model/Restaurant';
import { Employee } from '../../src/model/Employee';
import { Pizza } from '../../src/model/Pizza';
import { Ingredient } from '../../src/model/Ingredient';
import { EmployeeRole, OrderState } from '../../src/model/enums';

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('PersistenceManager', () => {
  let persistenceManager: PersistenceManager;
  let gameState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Reset singleton if possible or just get instance
    persistenceManager = PersistenceManager.getInstance();
    gameState = GameState.getInstance();

    // Clear GameState
    gameState.restaurants = [];
    gameState.ingredients.clear();
    gameState.player.setMoney(500);
  });

  it('should save game state to localStorage', () => {
    // Setup data
    const restaurant = new Restaurant();
    const ingredient = new Ingredient('test_ing', 'Test', 10, 'meat');
    const pizza = new Pizza('Test Pizza', [ingredient], 20);

    restaurant.inventory.set(ingredient.id, 5);
    restaurant.menu.push(pizza);

    gameState.addRestaurant(restaurant);
    gameState.registerIngredient(ingredient);

    // Save
    persistenceManager.saveGame();

    // Verify
    expect(localStorageMock.setItem).toHaveBeenCalledWith('pizza_save_v1', expect.any(String));

    const savedJson = localStorageMock.setItem.mock.calls[0][1];
    const parsed = JSON.parse(savedJson);

    expect(parsed.restaurants).toHaveLength(1);
    expect(parsed.restaurants[0].id).toBe(restaurant.id);
    expect(parsed.restaurants[0].inventory).toEqual([[ingredient.id, 5]]); // Map -> Array check
  });

  it('should load game state from localStorage', () => {
    // Prepare a mock save
    const mockSave = {
      playerMoney: 1000,
      time: { day: 2, hour: 12, minute: 30 },
      ingredients: [
          { id: 'ing1', name: 'Flour', baseCost: 5, type: 'dough' }
      ],
      restaurants: [
        {
          id: 'rest1',
          width: 10,
          height: 10,
          appeal: 5,
          reputation: { averageRating: 4.5, reviews: [] },
          inventory: [['ing1', 10]],
          menu: [
             { id: 'p1', name: 'Pizza 1', ingredientIds: ['ing1'], salePrice: 50 }
          ],
          employees: [
             {
                 name: 'Chef 1', role: EmployeeRole.Chef, skillLevel: 1, salary: 100,
                 gridX: 1, gridY: 1, state: 0, assetKey: 'chef',
                 targetX: 0, targetY: 0, blockedReason: null
             }
          ],
          furniture: [],
          customers: [],
          kitchenQueue: [],
          readyCounter: []
        }
      ]
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSave));

    // Load
    const success = persistenceManager.loadGame();

    expect(success).toBe(true);
    expect(gameState.player.money).toBe(1000);
    expect(gameState.restaurants).toHaveLength(1);

    const loadedRest = gameState.restaurants[0];
    expect(loadedRest).toBeInstanceOf(Restaurant); // Critical: Re-hydration check
    expect(loadedRest.id).toBe('rest1');
    expect(loadedRest.inventory.get('ing1')).toBe(10); // Map restored
    expect(loadedRest.employees[0]).toBeInstanceOf(Employee); // Employee re-hydration
    expect(loadedRest.menu[0]).toBeInstanceOf(Pizza); // Pizza re-hydration
  });

  it('should handle complex order serialization (Bug Fix Check)', () => {
      // Create a scenario where an order is active (e.g. in queue)
      // This verifies that 'pizza' in the order is serialized to an ID-reference structure, not a full object loop
      const restaurant = new Restaurant();
      const ingredient = new Ingredient('test_ing_2', 'Test 2', 5, 'veg');
      const pizza = new Pizza('Queue Pizza', [ingredient], 25);

      gameState.registerIngredient(ingredient);

      // Add Order to Kitchen Queue
      const order = {
          id: 'order_123',
          pizza: pizza,
          customerId: 'cust_1',
          state: OrderState.Pending,
          progress: 0,
          maxProgress: 100
      };
      restaurant.kitchenQueue.push(order);
      gameState.addRestaurant(restaurant);

      // Save
      persistenceManager.saveGame();

      // Inspect Saved Data
      const savedJson = localStorageMock.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedJson);
      const savedOrder = parsed.restaurants[0].kitchenQueue[0];

      // Verify serialization structure
      expect(savedOrder.pizza).toBeDefined();
      expect(savedOrder.pizza.ingredientIds).toEqual(['test_ing_2']); // Should be IDs, not objects
      expect(savedOrder.pizza.ingredients).toBeUndefined(); // Should NOT store full objects

      // Load back
      localStorageMock.getItem.mockReturnValue(savedJson);
      const success = persistenceManager.loadGame();
      expect(success).toBe(true);

      const loadedRest = gameState.restaurants[0];
      const loadedOrder = loadedRest.kitchenQueue[0];

      expect(loadedOrder.pizza).toBeInstanceOf(Pizza);
      expect(loadedOrder.pizza.ingredients[0]).toBeInstanceOf(Ingredient);
      expect(loadedOrder.pizza.ingredients[0].id).toBe('test_ing_2');
  });

  it('should return false if no save exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(persistenceManager.loadGame()).toBe(false);
  });

  it('should handle corrupt save data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('{ "corrupt": "json" '); // Invalid JSON

    const success = persistenceManager.loadGame();

    expect(success).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('pizza_save_v1');
  });
});
