import { IngredientType } from './enums';

export class Ingredient {
  constructor(
    public name: string,
    public baseCost: number,
    public type: IngredientType
  ) {}
}
