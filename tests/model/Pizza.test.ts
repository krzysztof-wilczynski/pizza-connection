import { describe, it, expect } from 'vitest';
import { Pizza } from '../../src/model/Pizza';
import { Ingredient } from '../../src/model/Ingredient';

describe('Pizza', () => {
  it('should calculate the cost of a pizza correctly', () => {
    // given
    const ingredient1 = new Ingredient('test-ingredient-1', 'Test Ingredient 1', 10);
    const ingredient2 = new Ingredient('test-ingredient-2', 'Test Ingredient 2', 20);
    const pizza = new Pizza('Test Pizza', [ingredient1, ingredient2], 50);

    // when
    const cost = pizza.getCost();

    // then
    expect(cost).toBe(30);
  });
});
