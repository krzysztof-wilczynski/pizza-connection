// src/data/ingredientDefinitions.ts
import { IngredientType } from '../model/enums';

export interface IngredientDefinition {
  id: string;
  name: string;
  baseCost: number;
  type: IngredientType;
}

export const INGREDIENT_DEFINITIONS: IngredientDefinition[] = [
  {
    id: 'tomato_sauce',
    name: 'Tomato Sauce',
    baseCost: 0.5,
    type: IngredientType.Sauce,
  },
  {
    id: 'cheese',
    name: 'Cheese',
    baseCost: 1,
    type: IngredientType.Cheese,
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    baseCost: 1.5,
    type: IngredientType.Topping,
  },
  {
    id: 'dough',
    name: 'Dough',
    baseCost: 0.3,
    type: IngredientType.Dough,
  },
  {
    id: 'salami',
    name: 'Salami',
    baseCost: 1.5,
    type: IngredientType.Topping,
  },
  {
    id: 'mushrooms',
    name: 'Pieczarki',
    baseCost: 1.0,
    type: IngredientType.Vegetable,
  },
  {
    id: 'peppers',
    name: 'Papryka',
    baseCost: 1.0,
    type: IngredientType.Vegetable,
  },
];
