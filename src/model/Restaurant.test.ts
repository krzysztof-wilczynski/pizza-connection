import { describe, it, expect } from 'vitest';
import { Restaurant } from './Restaurant';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Ingredient } from './Ingredient';
import { Furniture } from './Furniture';

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

  it('should add furniture correctly if space is free', () => {
    const restaurant = new Restaurant();
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
    const restaurant = new Restaurant();
    const table: Furniture = {
      id: 1, name: 'Table', price: 100, type: 'dining', stats: {},
      width: 1, height: 1, assetKey: 'table', color: 'red'
    };

    expect(restaurant.addFurniture(table, -1, 0)).toBe(false);
    expect(restaurant.addFurniture(table, 10, 0)).toBe(false);
  });

  it('should prevent overlapping furniture', () => {
    const restaurant = new Restaurant();
    const table: Furniture = {
      id: 1, name: 'Table', price: 100, type: 'dining', stats: {},
      width: 2, height: 2, assetKey: 'table', color: 'red'
    };

    restaurant.addFurniture(table, 2, 2); // Occupies (2,2), (3,2), (2,3), (3,3)

    // Try to add overlapping item
    const chair: Furniture = {
      id: 2, name: 'Chair', price: 50, type: 'dining', stats: {},
      width: 1, height: 1, assetKey: 'chair', color: 'blue'
    };

    expect(restaurant.addFurniture(chair, 2, 2)).toBe(false); // Direct overlap top-left
    expect(restaurant.addFurniture(chair, 3, 3)).toBe(false); // Overlap bottom-right
    expect(restaurant.addFurniture(chair, 1, 1)).toBe(true); // No overlap
  });
});
