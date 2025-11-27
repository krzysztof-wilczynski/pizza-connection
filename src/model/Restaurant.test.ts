import { describe, it, expect } from 'vitest';
import { Restaurant } from './Restaurant';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Ingredient } from './Ingredient';

describe('Restaurant', () => {
  it('should be created with a unique ID', () => {
    const restaurant1 = new Restaurant();
    const restaurant2 = new Restaurant();
    expect(restaurant1.id).not.toBe(restaurant2.id);
  });

  it('should have an empty inventory by default', () => {
    const restaurant = new Restaurant();
    expect(restaurant.inventory.size).toBe(0);
  });

  it('should have an empty menu by default', () => {
    const restaurant = new Restaurant();
    expect(restaurant.menu.length).toBe(0);
  });

  it('should have no employees by default', () => {
    const restaurant = new Restaurant();
    expect(restaurant.employees.length).toBe(0);
  });
});
