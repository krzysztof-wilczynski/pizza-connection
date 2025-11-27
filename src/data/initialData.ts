// src/data/initialData.ts
import { GameState } from '../model/GameState';
import { Restaurant } from '../model/Restaurant';
import { Pizza } from '../model/Pizza';
import { Ingredient } from '../model/Ingredient';
import { EmployeeRole, TileType } from '../model/enums';
import { GameMap } from '../model/Map';
import { INGREDIENT_DEFINITIONS } from './ingredientDefinitions';
import { Employee } from '../model/Employee';

export function loadInitialData(gameState: GameState, map: GameMap): void {
  // --- Register all ingredients in the central registry ---
  INGREDIENT_DEFINITIONS.forEach((def) => {
    const ingredient = new Ingredient(def.id, def.name, def.baseCost, def.type);
    gameState.registerIngredient(ingredient);
  });

  // --- Get ingredients from registry ---
  const tomatoSauce = gameState.getIngredient('tomato_sauce')!;
  const cheese = gameState.getIngredient('cheese')!;
  const pepperoni = gameState.getIngredient('pepperoni')!;

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

  // Znajdź pierwszą dostępną parcelę typu BuildingForSale i "kup" ją dla restauracji
  // Uwaga: nie ingerujemy w kasę gracza przy inicjalizacji — to tylko setup startowy.
  let placed = false;
  for (let r = 0; r < map.rows && !placed; r++) {
    for (let c = 0; c < map.cols && !placed; c++) {
      const tile = map.getTile(r, c);
      if (tile && tile.type === TileType.BuildingForSale) {
        map.purchaseBuilding(r, c, initialRestaurant.id);
        placed = true;
      }
    }
  }

  if (!placed) {
    console.error('Nie znaleziono żadnego budynku na sprzedaż do ustawienia startowej restauracji.');
  }

  console.log('Initial data loaded.', gameState);
}
