import { Player } from './Player';
import { Restaurant } from './Restaurant';
import {Ingredient} from './Ingredient';

export class GameState {
  private static instance: GameState;

  public gameDate: Date;
  public restaurants: Restaurant[];
  public player: Player;
  public ingredients: Map<string, Ingredient>; // Central ingredient registry

  private constructor() {
    this.gameDate = new Date(); // Initial game date
    this.restaurants = [];
    this.player = new Player(500000); // Starting money
    this.ingredients = new Map();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public addRestaurant(restaurant: Restaurant): void {
    this.restaurants.push(restaurant);
  }

  public registerIngredient(ingredient: Ingredient): void {
    this.ingredients.set(ingredient.id, ingredient);
  }

  public getIngredient(id: string): Ingredient | undefined {
    return this.ingredients.get(id);
  }

  public getAllIngredients(): Ingredient[] {
    return Array.from(this.ingredients.values());
  }
}
