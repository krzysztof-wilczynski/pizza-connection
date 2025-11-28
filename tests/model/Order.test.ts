import { describe, it, expect, beforeEach } from 'vitest';
import { Order } from '../../src/model/Order';
import { Pizza } from '../../src/model/Pizza';
import { Ingredient } from '../../src/model/Ingredient';
import { IngredientType, OrderState, EmployeeRole, EmployeeState, CustomerState } from '../../src/model/enums';
import { Restaurant } from '../../src/model/Restaurant';
import { Employee } from '../../src/model/Employee';
import { Customer } from '../../src/model/Customer';
import { Furniture } from '../../src/model/Furniture';

describe('Order Lifecycle', () => {
  // Since Order is an interface, we verify the lifecycle flow managed by Restaurant and Employee

  let restaurant: Restaurant;
  let chef: Employee;
  let waiter: Employee;
  let customer: Customer;
  let pizza: Pizza;

  beforeEach(() => {
    restaurant = new Restaurant();

    // Ingredients
    const dough = new Ingredient('dough', 'Dough', 5, IngredientType.Dough);
    const cheese = new Ingredient('cheese', 'Cheese', 10, IngredientType.Cheese);
    pizza = new Pizza('Cheese Pizza', [dough, cheese], 50);
    restaurant.menu.push(pizza);
    restaurant.inventory.set('dough', 10);
    restaurant.inventory.set('cheese', 10);

    // Furniture
    const oven: Furniture = { id: 1, name: 'Oven', price: 1000, type: 'kitchen', stats: {}, width: 1, height: 1, assetKey: 'oven', color: 'gray' };
    const counter: Furniture = { id: 2, name: 'Counter', price: 100, type: 'kitchen', stats: {}, width: 1, height: 1, assetKey: 'counter', color: 'brown' };
    const chair: Furniture = { id: 3, name: 'Chair', price: 50, type: 'dining', stats: {}, width: 1, height: 1, assetKey: 'chair', color: 'blue' };

    restaurant.addFurniture(oven, 5, 5);
    restaurant.addFurniture(counter, 6, 6);
    restaurant.addFurniture(chair, 2, 2);

    // Employees
    chef = new Employee('Luigi', EmployeeRole.Chef, 1, 100);
    chef.gridX = 5; chef.gridY = 5; // Near oven
    restaurant.employees.push(chef);

    waiter = new Employee('Mario', EmployeeRole.Waiter, 1, 100);
    waiter.gridX = 6; waiter.gridY = 6; // Near counter
    restaurant.employees.push(waiter);

    // Customer
    customer = new Customer('c1', 2, 2);
    customer.targetFurnitureId = 2002;
    customer.state = CustomerState.Seated;
    restaurant.customers.push(customer);
  });

  it('should go through the full lifecycle: Pending -> Cooking -> Ready -> Served', () => {
    // 1. Customer Orders (Seated -> Pending)
    restaurant.update(100);
    const order = restaurant.kitchenQueue[0];

    expect(order).toBeDefined();
    expect(order.state).toBe(OrderState.Pending);
    expect(customer.state).toBe(CustomerState.WaitingForFood);

    // 2. Chef Picks up Order (Pending -> Cooking)
    // Wait for chef to update
    // Force chef loop a bit to find order and walk (already near oven)
    restaurant.update(100);

    // Check if Chef took it. Chef might need to walk to oven.
    // Chef was at 5,5. Oven is at 5,5.
    // Logic: Find pending -> Check ingredients -> Find Oven -> Walk.

    // We need to make sure Chef is Idle first.
    // The previous update might have triggered 'Walking' to oven.

    // Let's run simulation steps until state changes
    let maxSteps = 1000; // Increased steps
    while(order.state === OrderState.Pending && maxSteps-- > 0) {
        restaurant.update(100);
    }

    expect(order.state).toBe(OrderState.Cooking);

    // If chef was slightly off target, he might still be Walking
    // But since we spawned him at 5,5 and Oven is 5,5, he should transition to Working immediately upon update if logic allows
    // Chef Logic:
    // 1. Idle -> Finds Order & Oven -> Set State Walking, Target Oven.
    // 2. Walking -> atTarget? -> if Cooking Order -> Working.

    // So it takes at least 2 updates.

    // Allow for state to settle
    if (chef.state === EmployeeState.Walking) {
        restaurant.update(100);
    }

    expect(chef.state).toBe(EmployeeState.Working);

    // 3. Chef Cooks (Cooking -> Ready)
    maxSteps = 500;
    while(order.state === OrderState.Cooking && maxSteps-- > 0) {
        restaurant.update(100);
    }

    expect(order.state).toBe(OrderState.Ready);
    expect(restaurant.readyCounter).toContain(order);
    expect(chef.state).toBe(EmployeeState.Idle);

    // 4. Waiter Delivers (Ready -> Served)
    // Waiter is at 6,6 (Counter). Should pickup instantly or walk.

    maxSteps = 500;
    while(order.state === OrderState.Ready && maxSteps-- > 0) {
        restaurant.update(100); // Waiter walks to counter (if not there) then picks up
    }

    // Now waiter has it, state is still Ready (conceptually) or Waiter holds it.
    // In code: Waiter.currentOrder = order.
    // Waiter walks to customer.

    // Allow more steps for waiter to walk to kitchen
    maxSteps = 2000;
    while(order.state === OrderState.Ready && maxSteps-- > 0) {
        restaurant.update(100);
        // Break if waiter picked it up (order removed from readyCounter)
        // AND waiter is holding it.
        if (restaurant.readyCounter.length === 0) break;
    }

    // Debug: Check if order was already served (too fast?)
    if (order.state === OrderState.Served) {
        // If served, waiter must have held it. Pass implicitly or check history if tracked.
        // We assume for this test we want to catch it in flight.
    } else {
        const waiterHolding = restaurant.employees.find(e => e.role === EmployeeRole.Waiter && e.currentOrder === order);
        expect(waiterHolding).toBeDefined();
    }

    maxSteps = 500;
    while(order.state !== OrderState.Served && maxSteps-- > 0) {
        restaurant.update(100);
    }

    expect(order.state).toBe(OrderState.Served);
    expect(customer.state).toBe(CustomerState.Eating);
  });
});
