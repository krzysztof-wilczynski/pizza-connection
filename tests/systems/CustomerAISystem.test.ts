import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerAISystem } from '../../src/systems/CustomerAISystem';
import { Customer } from '../../src/model/Customer';
import { Restaurant } from '../../src/model/Restaurant';
import { CustomerState } from '../../src/model/enums';

describe('CustomerAISystem', () => {
  let customer: Customer;
  let restaurant: Restaurant;

  beforeEach(() => {
    customer = new Customer('c1', 0, 0);
    restaurant = new Restaurant();
  });

  it('should handle arriving state correctly', () => {
    // Setup target chair
    restaurant.furniture = [
      { id: 'chair1', name: 'Chair', type: 'dining', width: 1, height: 1, price: 10, color: 'red', assetKey: 'chair', gridX: 5, gridY: 5 }
    ];
    customer.targetFurnitureId = 5005; // 5 * 1000 + 5
    customer.state = CustomerState.Arriving;

    // Simulate 1 second
    CustomerAISystem.update(customer, 1000, restaurant, []);

    // Should have moved towards target
    expect(customer.gridX).toBeGreaterThan(0);
    expect(customer.gridY).toBeGreaterThan(0);
  });

  it('should transition to Seated when close enough', () => {
    restaurant.furniture = [
      { id: 'chair1', name: 'Chair', type: 'dining', width: 1, height: 1, price: 10, color: 'red', assetKey: 'chair', gridX: 2, gridY: 2 }
    ];
    customer.targetFurnitureId = 2002;
    customer.state = CustomerState.Arriving;
    customer.gridX = 1.95;
    customer.gridY = 1.95;

    // Small step
    CustomerAISystem.update(customer, 1000, restaurant, []);

    expect(customer.state).toBe(CustomerState.Seated);
    expect(customer.gridX).toBe(2);
    expect(customer.gridY).toBe(2);
  });
});
