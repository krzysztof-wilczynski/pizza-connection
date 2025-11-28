import { Ingredient } from './Ingredient';
import { v4 as uuidv4 } from 'uuid';

export class Pizza {
  public id: string;

  constructor(
    public name: string,
    public ingredients: Ingredient[],
    public salePrice: number
  ) {
    this.id = uuidv4();
  }

  getCost(): number {
    return this.ingredients.reduce(
      (totalCost, ingredient) => totalCost + ingredient.baseCost,
      0
    );
  }
}
