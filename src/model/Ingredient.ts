// src/model/Ingredient.ts
import { IngredientType } from './enums';

export interface Ingredient {
    name: string;
    cost: number;
    type: IngredientType;
}
