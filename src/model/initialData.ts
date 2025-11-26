// src/model/initialData.ts
import { GameState } from './GameState';
import { Restaurant } from './Restaurant';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Ingredient } from './Ingredient';
import { EmployeeRole, IngredientType, TileType } from './enums';
import { GameMap } from '../Map';

export function loadInitialData(gameState: GameState, map: GameMap): void {
  // --- Ingredients ---
  const tomatoSauce = new Ingredient('Tomato Sauce', 0.5, IngredientType.Sauce);
  const cheese = new Ingredient('Cheese', 1, IngredientType.Cheese);
  const pepperoni = new Ingredient('Pepperoni', 1.5, IngredientType.Topping);

  // --- Pizzas ---
  const margherita = new Pizza('Margherita', [tomatoSauce, cheese], 8);
  const pepperoniPizza = new Pizza('Pepperoni Pizza', [tomatoSauce, cheese, pepperoni], 12);

  // --- Employees ---
  const chefGordon = new Employee('Gordon', EmployeeRole.Chef, 5, 2000);

  // --- Initial Restaurant ---
  const initialRestaurant = new Restaurant();
  initialRestaurant.menu.push(margherita, pepperoniPizza);
  initialRestaurant.employees.push(chefGordon);

  // Add the first restaurant to the game state
  gameState.addRestaurant(initialRestaurant);

  // Define a location for the initial restaurant
  const initialLocation = { row: 5, col: 5 };

  // Manually update the map tile to place the owned building
  // This bypasses the purchase logic for initial setup
  const grid = (map as any).grid; // Accessing private grid for setup
  if (grid[initialLocation.row] && grid[initialLocation.row][initialLocation.col]) {
      grid[initialLocation.row][initialLocation.col] = {
          type: TileType.BuildingOwned,
          restaurantId: initialRestaurant.id,
      };
  } else {
      console.error(`Initial restaurant location (${initialLocation.row},${initialLocation.col}) is invalid.`);
  }

  console.log('Initial data loaded.', gameState);
}
