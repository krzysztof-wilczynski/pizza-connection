import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../src/model/GameState';
import { Restaurant } from '../../src/model/Restaurant';
import { Ingredient } from '../../src/model/Ingredient';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    // Since GameState is a singleton, we need to reset it before each test.
    // This is a common pattern for testing singletons.
    (GameState as any).instance = undefined;
    gameState = GameState.getInstance();
  });

  it('should be a singleton', () => {
    const anotherGameState = GameState.getInstance();
    expect(gameState).toBe(anotherGameState);
  });

  it('should start with a player with 500000 money', () => {
    expect(gameState.player.money).toBe(500000);
  });

  it('should add a restaurant', () => {
    const restaurant = new Restaurant('Test Restaurant', 1000, 1, 1);
    gameState.addRestaurant(restaurant);
    expect(gameState.restaurants).toContain(restaurant);
  });

  it('should register and get an ingredient', () => {
    const ingredient = new Ingredient('test-ingredient', 'Test Ingredient', 10);
    gameState.registerIngredient(ingredient);
    const retrievedIngredient = gameState.getIngredient('test-ingredient');
    expect(retrievedIngredient).toEqual(ingredient);
  });

  it('should get all ingredients', () => {
    const ingredient1 = new Ingredient('test-ingredient-1', 'Test Ingredient 1', 10);
    const ingredient2 = new Ingredient('test-ingredient-2', 'Test Ingredient 2', 20);
    gameState.registerIngredient(ingredient1);
    gameState.registerIngredient(ingredient2);
    const allIngredients = gameState.getAllIngredients();
    expect(allIngredients).toEqual([ingredient1, ingredient2]);
  });
});
