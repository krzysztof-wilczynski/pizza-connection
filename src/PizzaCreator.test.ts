import { describe, it, expect } from 'vitest';
import { PizzaCreator } from './PizzaCreator';

describe('PizzaCreator', () => {
  it('should calculate the price of a pizza correctly', () => {
    // given
    const pizzaCreator = new PizzaCreator();
    (pizzaCreator as any).selectedIngredients = [
      { ingredient: { name: 'Ser', cost: 2, priceModifier: 1.2, color: '#FFD700' } },
      { ingredient: { name: 'Salami', cost: 3, priceModifier: 1.5, color: '#DC143C' } },
    ];

    // when
    const { baseCost, sellPrice } = (pizzaCreator as any).calculatePrice();

    // then
    expect(baseCost).toBe(5);
    expect(sellPrice).toBe(6.75); // (2 * 1.2 + 3 * 1.5) / 2 * 5 = (2.4 + 4.5) / 2 * 5 = 3.45 * 5 = 17.25 - WRONG
                               // ( (1.2 + 1.5) / 2 ) * 5 = 1.35 * 5 = 6.75 - CORRECT
  });

  it('should save a pizza recipe correctly', () => {
    // given
    const pizzaCreator = new PizzaCreator();
    (pizzaCreator as any).pizzaName = 'Test Pizza';
    (pizzaCreator as any).selectedIngredients = [
      { ingredient: { name: 'Ser', cost: 2, priceModifier: 1.2, color: '#FFD700' } },
    ];

    // when
    const recipe = pizzaCreator.saveToMenu();

    // then
    expect(recipe.name).toBe('Test Pizza');
    expect(recipe.ingredients).toEqual(['Ser']);
    expect(recipe.baseCost).toBe(2);
    expect(recipe.sellPrice).toBe(2.4);
  });
});
