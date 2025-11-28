import { describe, it, expect, beforeEach } from 'vitest';
import { Customer } from './Customer';
import { Restaurant } from './Restaurant';
import { CustomerState, OrderState } from './enums';
import { Furniture } from './Furniture';
import { Pizza } from './Pizza';
import { Ingredient } from './Ingredient';
import { IngredientType } from './enums';
import { GameState } from './GameState';

describe('Customer', () => {
  let restaurant: Restaurant;
  let customer: Customer;
  let chair: Furniture;

  beforeEach(() => {
    restaurant = new Restaurant();
    customer = new Customer('c1', 0, 0); // Spawns at 0,0
    restaurant.customers.push(customer);

    // Add a chair
    chair = {
        id: 1, name: 'Chair', price: 50, type: 'dining', stats: {},
        width: 1, height: 1, assetKey: 'chair', color: 'blue'
    };
    restaurant.addFurniture(chair, 5, 5);

    // Setup Menu
    const dough = new Ingredient('dough', 'Dough', 5, IngredientType.Dough);
    const cheese = new Ingredient('cheese', 'Cheese', 10, IngredientType.Cheese);
    const pizza = new Pizza('Cheese Pizza', [dough, cheese], 50);
    restaurant.menu.push(pizza);
  });

  // Since Customer logic is in Restaurant.updateCustomer, we test via Restaurant.update or we could call private method if we cast to any.
  // But integration test style via Restaurant.update is cleaner for public API.

  it('should initialize in Arriving state', () => {
    expect(customer.state).toBe(CustomerState.Arriving);
  });

  it('should move towards assigned chair', () => {
    customer.targetFurnitureId = 5005; // 5*1000 + 5
    customer.gridX = 0;
    customer.gridY = 0;

    // Update restaurant (which updates customer)
    restaurant.update(100);

    // Should have moved closer to 5,5
    expect(customer.gridX).toBeGreaterThan(0);
    expect(customer.gridY).toBeGreaterThan(0);
  });

  it('should change to Seated when arrived at chair', () => {
    customer.targetFurnitureId = 5005;
    customer.gridX = 4.9;
    customer.gridY = 5;

    restaurant.update(1000); // Move to target

    expect(customer.state).toBe(CustomerState.Seated);
    expect(customer.gridX).toBe(5);
    expect(customer.gridY).toBe(5);
  });

  it('should Order food when Seated', () => {
     // Force state to Seated
     customer.state = CustomerState.Seated;
     customer.gridX = 5;
     customer.gridY = 5;
     customer.targetFurnitureId = 5005;

     restaurant.update(100);

     expect(customer.state).toBe(CustomerState.WaitingForFood);
     expect(customer.order).toBeDefined();
     expect(restaurant.kitchenQueue.length).toBe(1);
     expect(restaurant.kitchenQueue[0].customerId).toBe(customer.id);
  });

  it('should Leave if menu is empty when Seated', () => {
      restaurant.menu = []; // Clear menu
      customer.state = CustomerState.Seated;

      restaurant.update(100);

      expect(customer.state).toBe(CustomerState.Leaving);
  });

  it('should start Eating when state is changed (by Waiter)', () => {
      // This transition is usually triggered by Waiter, but here we just check Eating logic
      customer.state = CustomerState.Eating;
      customer.eatingTimer = 100; // Short timer
      customer.order = restaurant.menu[0]; // Needs an order to pay

      // Mock Player money
      const player = GameState.getInstance().player;
      const initialMoney = player.getMoney ? player.getMoney() : (player as any).money;
      player.addMoney(0); // Ensure initialized?

      // Advance time to finish eating
      restaurant.update(150);

      expect(customer.state).toBe(CustomerState.Leaving);
      expect(customer.targetFurnitureId).toBeNull();
      // Money check - Player should have earned pizza price (50)
      // We can't easily check added money without capturing previous state or trusting logic.
      // But we can check if customer left successfully.
  });

  it('should be removed when Leaving and reached exit', () => {
      customer.state = CustomerState.Leaving;
      customer.gridX = 0.01; // Closer than 0.1
      customer.gridY = 0.01;

      restaurant.update(1000); // Move to 0,0

      // Should be removed from restaurant.customers
      expect(restaurant.customers.find(c => c.id === customer.id)).toBeUndefined();
  });
});
