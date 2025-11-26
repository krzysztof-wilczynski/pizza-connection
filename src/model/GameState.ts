// src/model/GameState.ts
import { Restaurant } from './Restaurant';

export class GameState {
    private static instance: GameState;

    public restaurants: Restaurant[] = [];
    public gameTime: { day: number; hour: number } = { day: 1, hour: 8 };
    public playerMoney: number = 0;

    private constructor() {
        // Private constructor to prevent direct instantiation
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

    public setInitialMoney(money: number): void {
        this.playerMoney = money;
    }

    // Example of a time progression method
    public advanceTime(): void {
        this.gameTime.hour++;
        if (this.gameTime.hour >= 24) {
            this.gameTime.hour = 0;
            this.gameTime.day++;
        }
    }
}
