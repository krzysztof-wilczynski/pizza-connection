// src/model/initialData.ts
import { GameState } from './GameState';
import { Restaurant } from './Restaurant';
import { PizzaRecipe } from './PizzaRecipe';
import { Employee } from './Employee';
import { Ingredient } from './Ingredient';
import { EmployeeRole, IngredientType } from './enums';
import { v4 as uuidv4 } from 'uuid';
import { GameMap, TileType } from '../Map'; // Correctly import GameMap and TileType

// --- Ingredients ---
const tomatoSauce: Ingredient = { name: 'Tomato Sauce', cost: 0.5, type: IngredientType.SAUCE };
const cheese: Ingredient = { name: 'Cheese', cost: 1, type: IngredientType.CHEESE };
const pepperoni: Ingredient = { name: 'Pepperoni', cost: 1.5, type: IngredientType.MEAT };
const mushrooms: Ingredient = { name: 'Mushrooms', cost: 0.8, type: IngredientType.VEGETABLE };
const olives: Ingredient = { name: 'Olives', cost: 0.7, type: IngredientType.VEGETABLE };

// --- Pizza Recipes ---
const margherita: PizzaRecipe = {
    name: 'Margherita',
    ingredients: [tomatoSauce, cheese],
    price: 8
};

const pepperoniPizza: PizzaRecipe = {
    name: 'Pepperoni Pizza',
    ingredients: [tomatoSauce, cheese, pepperoni],
    price: 12
};

// --- Employees ---
const chefGordon: Employee = {
    name: 'Gordon Ramsy',
    role: EmployeeRole.CHEF,
    skillLevel: 5,
    salary: 2000
};

// --- Initial Restaurant ---
const initialRestaurant: Restaurant = {
    id: uuidv4(),
    location: { row: 5, col: 5 }, // Example location, ensure this tile is empty
    furniture: [],
    menu: [margherita, pepperoniPizza],
    employees: [chefGordon],
    stats: { reputation: 15, dailyIncome: 0 }
};

export function loadInitialData(gameState: GameState, map: GameMap): void {
    // Note: The player starts with enough money to buy a building.
    // The initial restaurant is now created when a building is purchased for the first time.
    // This function will only set up the initial money.
    // We can later extend it to pre-populate the map with an owned building if needed.

    gameState.setInitialMoney(2500000);

    /*
    // This part is commented out, as the current game flow is to BUY a building first.
    // If the game were to start with a pre-owned restaurant, we would uncomment this.

    // Add the first restaurant to the game state
    gameState.addRestaurant(initialRestaurant);

    // Update the map tile to link it to the restaurant
    const { row, col } = initialRestaurant.location;
    const tile = map.getTile(row, col);
    if (tile) {
        tile.type = TileType.BuildingOwned;
        tile.restaurantId = initialRestaurant.id;
    } else {
        console.error(`Initial restaurant location (${row},${col}) is invalid.`);
    }
    */

    console.log('Initial data loaded (player money set).', gameState);
}
