import { Ingredient } from './Ingredient';

export class Pizza {
  constructor(
    public name: string,
    public ingredients: Ingredient[],
    public salePrice: number
  ) {}

  getCost(): number {
    return this.ingredients.reduce(
      (totalCost, ingredient) => totalCost + ingredient.baseCost,
      0
    );
  }
}
