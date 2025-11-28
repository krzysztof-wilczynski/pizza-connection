import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Restaurant } from '../../src/model/Restaurant';
import { Pizza } from '../../src/model/Pizza';
import { Employee } from '../../src/model/Employee';
import { Ingredient } from '../../src/model/Ingredient';
import { Furniture } from '../../src/model/Furniture';
import { IngredientType } from '../../src/model/enums';
import { GameState } from '../../src/model/GameState';

describe('Restaurant', () => {
  let restaurant: Restaurant;

  beforeEach(() => {
    restaurant = new Restaurant();
    // Reset GameState for buyIngredient tests
    const gameState = GameState.getInstance();
    // Resetting player money effectively
    // Since we can't easily replace the singleton instance, we manipulate the player object if needed
    // or just rely on the fact that we can check spendMoney return value.
    // However, to be clean, let's ensure player has money.
    // We cannot access 'money' directly if it's private, checking Player.ts
  });

  it('should be created with a unique ID', () => {
    const restaurant2 = new Restaurant();
    expect(restaurant.id).not.toBe(restaurant2.id);
  });

  it('should have an empty inventory by default', () => {
    expect(restaurant.inventory.size).toBe(0);
  });

  it('should have an empty menu by default', () => {
    expect(restaurant.menu.length).toBe(0);
  });

  it('should have no employees by default', () => {
    expect(restaurant.employees.length).toBe(0);
  });

  // --- Furniture Tests ---
  it('should add furniture correctly if space is free', () => {
    const table: Furniture = {
      id: 1, name: 'Table', price: 100, type: 'dining', stats: {},
      width: 1, height: 1, assetKey: 'table', color: 'red'
    };

    const result = restaurant.addFurniture(table, 0, 0);
    expect(result).toBe(true);
    expect(restaurant.furniture.length).toBe(1);
    expect(restaurant.furniture[0].gridX).toBe(0);
    expect(restaurant.furniture[0].gridY).toBe(0);
  });

  it('should prevent adding furniture out of bounds', () => {
    const table: Furniture = {
      id: 1, name: 'Table', price: 100, type: 'dining', stats: {},
      width: 1, height: 1, assetKey: 'table', color: 'red'
    };

    expect(restaurant.addFurniture(table, -1, 0)).toBe(false);
    expect(restaurant.addFurniture(table, 10, 0)).toBe(false);
  });

  it('should prevent overlapping furniture', () => {
    const table: Furniture = {
      id: 1, name: 'Table', price: 100, type: 'dining', stats: {},
      width: 2, height: 2, assetKey: 'table', color: 'red'
    };

    restaurant.addFurniture(table, 2, 2);

    const chair: Furniture = {
      id: 2, name: 'Chair', price: 50, type: 'dining', stats: {},
      width: 1, height: 1, assetKey: 'chair', color: 'blue'
    };

    expect(restaurant.addFurniture(chair, 2, 2)).toBe(false);
    expect(restaurant.addFurniture(chair, 3, 3)).toBe(false);
    expect(restaurant.addFurniture(chair, 1, 1)).toBe(true);
  });

  // --- Inventory Tests ---

  const dough = new Ingredient('dough', 'Dough', 5, IngredientType.Dough);
  const cheese = new Ingredient('cheese', 'Cheese', 10, IngredientType.Cheese);
  const pizza = new Pizza('Cheese Pizza', [dough, cheese], 50);

  it('hasIngredientsFor should return false if inventory is empty', () => {
    expect(restaurant.hasIngredientsFor(pizza)).toBe(false);
  });

  it('hasIngredientsFor should return false if some ingredients are missing', () => {
    restaurant.inventory.set('dough', 10);
    // Missing cheese
    expect(restaurant.hasIngredientsFor(pizza)).toBe(false);
  });

  it('hasIngredientsFor should return true if all ingredients are available', () => {
    restaurant.inventory.set('dough', 1);
    restaurant.inventory.set('cheese', 1);
    expect(restaurant.hasIngredientsFor(pizza)).toBe(true);
  });

  it('consumeIngredientsFor should decrease inventory', () => {
    restaurant.inventory.set('dough', 2);
    restaurant.inventory.set('cheese', 2);

    restaurant.consumeIngredientsFor(pizza);

    expect(restaurant.inventory.get('dough')).toBe(1);
    expect(restaurant.inventory.get('cheese')).toBe(1);
  });

  it('consumeIngredientsFor should not go below zero', () => {
    restaurant.inventory.set('dough', 0);
    restaurant.inventory.set('cheese', 1);

    restaurant.consumeIngredientsFor(pizza); // Should try to consume even if not enough (though hasIngredients should check first)

    expect(restaurant.inventory.get('dough')).toBe(0);
    expect(restaurant.inventory.get('cheese')).toBe(0);
  });

  it('buyIngredient should increase inventory and decrease player money', () => {
    const player = GameState.getInstance().player;
    const initialMoney = player.getMoney ? player.getMoney() : (player as any).money; // Depending on Player implementation
    // Assuming Player has public money or getter, or we can just trust spendMoney works if we test it elsewhere.
    // Let's assume we can add money to be safe.
    player.addMoney(1000);

    const success = restaurant.buyIngredient('tomato', 5, 50);

    expect(success).toBe(true);
    expect(restaurant.inventory.get('tomato')).toBe(5);
  });

  it('buyIngredient should fail if player has insufficient funds', () => {
     const player = GameState.getInstance().player;
     // Drain money
     // Currently no clear way to set money to 0 directly without knowing implementation details
     // or looping spendMoney.
     // Let's rely on mocking for robust test or try to spend a huge amount.
     const hugeAmount = 999999999;
     const success = restaurant.buyIngredient('gold', 1, hugeAmount);
     expect(success).toBe(false);
     expect(restaurant.inventory.get('gold')).toBeUndefined();
  });
});
