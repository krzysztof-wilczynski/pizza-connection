import { Player } from './Player';
import { Restaurant } from './Restaurant';

export class GameState {
  private static instance: GameState;

  public gameDate: Date;
  public restaurants: Restaurant[];
  public player: Player;

  private constructor() {
    this.gameDate = new Date(); // Initial game date
    this.restaurants = [];
    this.player = new Player(50000); // Starting money
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
}
