import { describe, it, expect, vi } from 'vitest';
import { PizzaCreator } from '../../src/views/PizzaCreator';
import { Ingredient } from '../../src/model/Ingredient';
import { AssetManager } from '../../src/systems/AssetManager';
import { IngredientType } from '../../src/model/enums';

// Mock AssetManager
const mockAssetManager = {
  getImage: vi.fn(),
  loadAsset: vi.fn(),
} as unknown as AssetManager;

describe('PizzaCreator', () => {
  it('should calculate the price of a pizza correctly', () => {
    // given
    const pizzaCreator = new PizzaCreator(mockAssetManager);
    (pizzaCreator as any).selectedIngredients = [
      { ingredient: { name: 'Ser', cost: 2, priceModifier: 1.2, color: '#FFD700', type: IngredientType.Cheese } },
      { ingredient: { name: 'Salami', cost: 3, priceModifier: 1.5, color: '#DC143C', type: IngredientType.Topping } },
    ];

    // when
    const { baseCost, sellPrice } = (pizzaCreator as any).calculatePrice();

    // then
    // Logic changed: baseCost = sum(ingredients) + dough(2.0)
    // 2 + 3 + 2 = 7
    expect(baseCost).toBe(7);

    // sellPrice = baseCost * avgModifier * 1.5
    // avgModifier = (1.2 + 1.5) / 2 = 1.35
    // 7 * 1.35 * 1.5 = 14.175
    expect(sellPrice).toBeCloseTo(14.175);
  });

  it('should save a pizza recipe correctly', () => {
    // given
    const pizzaCreator = new PizzaCreator(mockAssetManager);
    (pizzaCreator as any).pizzaName = 'Test Pizza';
    (pizzaCreator as any).selectedIngredients = [
      { ingredient: { name: 'Ser', cost: 2, priceModifier: 1.2, color: '#FFD700', type: IngredientType.Cheese } },
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
    // baseCost = 2 + 2 = 4
    // avgModifier = 1.2
    // sellPrice = 4 * 1.2 * 1.5 = 7.2
    expect(pizza.salePrice).toBeCloseTo(7.2);
  });
});
