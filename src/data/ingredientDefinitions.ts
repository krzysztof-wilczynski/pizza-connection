// src/data/ingredientDefinitions.ts
import { IngredientType } from '../model/enums';

export interface IngredientDefinition {
  id: string;
  name: string;
  baseCost: number;
  type: IngredientType;
  assetKey: string;
}

export const INGREDIENT_DEFINITIONS: IngredientDefinition[] = [
  {
    id: 'tomato_sauce',
    name: 'Tomato Sauce',
    baseCost: 0.5,
    type: IngredientType.Sauce,
    assetKey: 'ingredients_sauce',
  },
  {
    id: 'cheese',
    name: 'Cheese',
    baseCost: 1,
    type: IngredientType.Cheese,
    assetKey: 'ingredients_cheese',
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    baseCost: 1.5,
    type: IngredientType.Topping,
    assetKey: 'ingredients_salami',
  },
  {
    id: 'dough',
    name: 'Dough',
    baseCost: 0.3,
    type: IngredientType.Dough,
    assetKey: 'ingredients_dough',
  },
  {
    id: 'salami',
    name: 'Salami',
    baseCost: 1.5,
    type: IngredientType.Topping,
    assetKey: 'ingredients_salami',
  },
  {
    id: 'mushrooms',
    name: 'Pieczarki',
    baseCost: 1.0,
    type: IngredientType.Vegetable,
    assetKey: 'ingredients_mushroom',
  },
  {
    id: 'peppers',
    name: 'Papryka',
    baseCost: 1.0,
    type: IngredientType.Vegetable,
    assetKey: 'ingredients_pepper',
  },
];
