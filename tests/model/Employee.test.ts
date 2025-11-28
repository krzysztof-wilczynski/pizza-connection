import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Employee } from '../../src/model/Employee';
import { Restaurant } from '../../src/model/Restaurant';
import { EmployeeRole, EmployeeState, OrderState } from '../../src/model/enums';
import { Order } from '../../src/model/Order';
import { Pizza } from '../../src/model/Pizza';
import { Ingredient } from '../../src/model/Ingredient';
import { IngredientType } from '../../src/model/enums';
import { Furniture } from '../../src/model/Furniture';
import { Customer } from '../../src/model/Customer';
import { CustomerState } from '../../src/model/enums';

describe('Employee', () => {
  let restaurant: Restaurant;

  // Mock ingredients and pizza
  const dough = new Ingredient('dough', 'Dough', 5, IngredientType.Dough);
  const cheese = new Ingredient('cheese', 'Cheese', 10, IngredientType.Cheese);
  const pizza = new Pizza('Cheese Pizza', [dough, cheese], 50);

  beforeEach(() => {
    restaurant = new Restaurant();
  });

  // --- Chef Tests ---
  describe('Chef', () => {
    let chef: Employee;
    let oven: Furniture;

    beforeEach(() => {
      chef = new Employee('Luigi', EmployeeRole.Chef, 1, 100);
      chef.gridX = 0;
      chef.gridY = 0;

      // Setup Oven
      oven = {
        id: 1, name: 'Oven', price: 1000, type: 'kitchen', stats: {},
        width: 1, height: 1, assetKey: 'oven', color: 'gray'
      };
      restaurant.addFurniture(oven, 5, 5); // Oven at (5,5)
    });

    it('should be Idle initially', () => {
      expect(chef.state).toBe(EmployeeState.Idle);
    });

    it('should stay Idle if no orders', () => {
      chef.update(100, restaurant);
      expect(chef.state).toBe(EmployeeState.Idle);
    });

    it('should ignore order if ingredients are missing', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Pending, progress: 0, maxProgress: 100 };
      restaurant.kitchenQueue.push(order);
      // Empty inventory

      chef.update(100, restaurant);

      expect(chef.state).toBe(EmployeeState.Idle);
      expect(order.state).toBe(OrderState.Pending);
    });

    it('should pickup order and walk to oven if ingredients available', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Pending, progress: 0, maxProgress: 100 };
      restaurant.kitchenQueue.push(order);
      restaurant.inventory.set('dough', 10);
      restaurant.inventory.set('cheese', 10);

      // Force update to trigger logic
      chef.update(100, restaurant);

      expect(chef.state).toBe(EmployeeState.Walking);
      // oven in test scope is the raw Furniture object (no gridX),
      // but we placed it at 5,5.
      expect(chef.targetX).toBe(5);
      expect(chef.targetY).toBe(5);
      expect(chef.currentOrder).toBe(order);
      expect(order.state).toBe(OrderState.Cooking);
      // Ingredients should be consumed
      expect(restaurant.inventory.get('dough')).toBe(9);
    });

    it('should start Working when arrived at oven', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Cooking, progress: 0, maxProgress: 100 };
      chef.currentOrder = order;
      chef.state = EmployeeState.Walking;
      chef.targetX = 5;
      chef.targetY = 5;
      chef.gridX = 4.9; // Almost there
      chef.gridY = 5;

      chef.update(1000, restaurant); // Move enough to reach

      expect(chef.state).toBe(EmployeeState.Working);
    });

    it('should finish cooking and make order Ready', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Cooking, progress: 99, maxProgress: 100 };
      chef.currentOrder = order;
      chef.state = EmployeeState.Working;

      // Simulate enough time to finish (progress += dt * 0.05)
      // Need 1 unit of progress -> 20ms? No, dt * 0.05.
      // If we need 1 more progress, 1 / 0.05 = 20ms.

      chef.update(1000, restaurant);

      expect(order.state).toBe(OrderState.Ready);
      expect(order.progress).toBe(100);
      expect(chef.state).toBe(EmployeeState.Idle);
      expect(chef.currentOrder).toBeNull();
      expect(restaurant.readyCounter).toContain(order);
    });
  });

  // --- Waiter Tests ---
  describe('Waiter', () => {
    let waiter: Employee;
    let counter: Furniture;
    let customer: Customer;

    beforeEach(() => {
      waiter = new Employee('Mario', EmployeeRole.Waiter, 1, 100);
      waiter.gridX = 9;
      waiter.gridY = 9;

      // Setup Counter/Kitchen for pickup
      counter = {
        id: 2, name: 'Counter', price: 100, type: 'kitchen', stats: {},
        width: 1, height: 1, assetKey: 'counter', color: 'brown'
      };
      restaurant.addFurniture(counter, 0, 0);

      // Setup Customer
      customer = new Customer('c1', 5, 5);
      customer.state = CustomerState.WaitingForFood;
      restaurant.customers.push(customer);
    });

    it('should walk to counter if Order is Ready', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Ready, progress: 100, maxProgress: 100 };
      restaurant.readyCounter.push(order);

      // Waiter needs to be Idle first.
      waiter.state = EmployeeState.Idle;

      waiter.update(100, restaurant);

      expect(waiter.state).toBe(EmployeeState.Walking);
      // counter placed at 0,0
      expect(waiter.targetX).toBe(0);
      expect(waiter.targetY).toBe(0);
    });

    it('should pickup food when at counter', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Ready, progress: 100, maxProgress: 100 };
      restaurant.readyCounter.push(order);

      waiter.state = EmployeeState.Walking;
      waiter.targetX = 0;
      waiter.targetY = 0;
      waiter.gridX = 0.05; // Very close (dist < 0.1)
      waiter.gridY = 0;

      // Update with large enough delta time or speed to ensure move/check happens
      // Actually logic checks `atTarget()` first or moves then checks?
      // updateWaiter: Walking -> move -> if atTarget -> Logic.
      // If we are already at 0.05, 0 (dist 0.05), atTarget() is true.

      waiter.update(100, restaurant);

      expect(waiter.currentOrder).toBe(order);
      expect(restaurant.readyCounter.length).toBe(0); // Removed from counter
      // Should now target customer
      expect(waiter.targetX).toBe(customer.gridX);
      expect(waiter.targetY).toBe(customer.gridY);
    });

    it('should deliver food when at Customer', () => {
      const order: Order = { id: 'o1', pizza: pizza, customerId: 'c1', state: OrderState.Ready, progress: 100, maxProgress: 100 };
      waiter.currentOrder = order;
      waiter.state = EmployeeState.Walking;
      waiter.targetX = 5;
      waiter.targetY = 5;
      waiter.gridX = 4.9;
      waiter.gridY = 5;

      waiter.update(1000, restaurant);

      expect(waiter.state).toBe(EmployeeState.Idle);
      expect(waiter.currentOrder).toBeNull();
      expect(order.state).toBe(OrderState.Served);
      expect(customer.state).toBe(CustomerState.Eating);
    });
  });
});
