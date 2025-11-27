import { describe, it, expect } from 'vitest';
import { PizzaCreator } from './PizzaCreator';
import { Ingredient } from './model/Ingredient';

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
    expect(sellPrice).toBe(6.75);
  });

  it('should save a pizza recipe correctly', () => {
    // given
    const pizzaCreator = new PizzaCreator();
    (pizzaCreator as any).pizzaName = 'Test Pizza';
    (pizzaCreator as any).selectedIngredients = [
      { ingredient: { name: 'Ser', cost: 2, priceModifier: 1.2, color: '#FFD700' } },
    ];

    // when
    const pizza = pizzaCreator.saveToMenu(); // Returns Pizza object now

    // then
    expect(pizza.name).toBe('Test Pizza');
    // Verify ingredients are Ingredient objects
    expect(pizza.ingredients).toHaveLength(1);
    expect(pizza.ingredients[0]).toBeInstanceOf(Ingredient);
    expect(pizza.ingredients[0].name).toBe('Ser');
    expect(pizza.ingredients[0].baseCost).toBe(2);

    // Check calculated price on the Pizza object
    // Pizza uses getCost() which sums baseCosts.
    // It also has public salePrice property.
    expect(pizza.salePrice).toBe(2.4);
  });
});
