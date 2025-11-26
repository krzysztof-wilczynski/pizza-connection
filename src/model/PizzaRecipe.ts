// src/model/PizzaRecipe.ts
import { Ingredient } from './Ingredient';

export interface PizzaRecipe {
    name: string;
    ingredients: Ingredient[];
    price: number;
}
