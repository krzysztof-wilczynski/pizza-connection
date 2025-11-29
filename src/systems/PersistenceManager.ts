import { GameState } from '../model/GameState';
import { Restaurant } from '../model/Restaurant';
import { Employee } from '../model/Employee';
import { Customer } from '../model/Customer';
import { Pizza } from '../model/Pizza';
import { Ingredient } from '../model/Ingredient';
import { Order } from '../model/Order';
import { ReputationSystem } from '../model/ReputationSystem';
import { TimeManager } from './TimeManager';
import { INGREDIENT_DEFINITIONS } from '../data/ingredientDefinitions';
import { InteriorTile } from '../model/Tile';

// DTO Interfaces for Serialization
interface GameStateDTO {
  restaurants: RestaurantDTO[];
  playerMoney: number;
  time: {
    day: number;
    hour: number;
    minute: number;
  };
  ingredients: IngredientDTO[];
}

interface RestaurantDTO {
  id: string;
  reputation: {
      averageRating: number;
      reviews: any[];
  };
  inventory: [string, number][]; // Map converted to Array
  menu: PizzaDTO[];
  employees: EmployeeDTO[];
  furniture: any[]; // PlacedFurniture
  customers: CustomerDTO[];
  kitchenQueue: any[]; // Order
  readyCounter: any[]; // Order
  width: number;
  height: number;
  appeal: number;
  grid: InteriorTile[][];
}

interface PizzaDTO {
  id: string;
  name: string;
  ingredientIds: string[]; // Store IDs instead of full objects
  salePrice: number;
}

interface EmployeeDTO {
  name: string;
  role: any;
  skillLevel: number;
  salary: number;
  gridX: number;
  gridY: number;
  state: any;
  assetKey: string;
  currentOrder: any;
  targetX: number;
  targetY: number;
  blockedReason: string | null;
}

interface CustomerDTO {
  id: string;
  gridX: number;
  gridY: number;
  state: any;
  targetFurnitureId: number | null;
  order: PizzaDTO | null;
  eatingTimer: number;
  hasReviewed: boolean;
  // We need to capture private fields if they are important,
  // but Customer class has private arrivalTime/waitingForFoodTime.
  // We will assume for now that re-simulation of waiting is acceptable
  // or we need to expose them/use 'any' to access during save.
  arrivalTime: number;
  waitingForFoodTime: number;
}

interface IngredientDTO {
    id: string;
    name: string;
    baseCost: number;
    type: any;
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  private readonly SAVE_KEY = 'pizza_save_v1';

  private constructor() {}

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  public saveGame(): void {
    try {
      const gameState = GameState.getInstance();
      const timeManager = TimeManager.getInstance();

      const dto: GameStateDTO = {
        playerMoney: gameState.player.money,
        time: {
          day: timeManager.day,
          hour: timeManager.hour,
          minute: timeManager.minute
        },
        ingredients: Array.from(gameState.ingredients.values()).map(ing => ({
            id: ing.id,
            name: ing.name,
            baseCost: ing.baseCost,
            type: ing.type
        })),
        restaurants: gameState.restaurants.map(r => this.serializeRestaurant(r))
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(dto));
      console.log('Game Saved!');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  public loadGame(): boolean {
    try {
      const json = localStorage.getItem(this.SAVE_KEY);
      if (!json) return false;

      const dto: GameStateDTO = JSON.parse(json);
      const gameState = GameState.getInstance();
      const timeManager = TimeManager.getInstance();

      // 1. Restore Time
      timeManager.day = dto.time.day;
      timeManager.hour = dto.time.hour;
      timeManager.minute = dto.time.minute;

      // 2. Restore Ingredients (Registry)
      // First, ensure all static definitions are loaded (in case save has old ones)
      // But also trust the save for unlocked stuff if we had that mechanics.
      // For now, we follow initialData pattern to ensure registry is populated.
      // If save has ingredients, we use them.
      if (dto.ingredients && dto.ingredients.length > 0) {
          dto.ingredients.forEach(ingDto => {
             const ing = new Ingredient(ingDto.id, ingDto.name, ingDto.baseCost, ingDto.type);
             gameState.registerIngredient(ing);
          });
      } else {
          // Fallback if older save or missing data
           INGREDIENT_DEFINITIONS.forEach((def) => {
                const ingredient = new Ingredient(def.id, def.name, def.baseCost, def.type);
                gameState.registerIngredient(ingredient);
            });
      }

      // 3. Restore Player
      gameState.player.setMoney(dto.playerMoney); // We need to add setMoney to Player or use spend/add hack

      // 4. Restore Restaurants
      gameState.restaurants = dto.restaurants.map(rDto => this.deserializeRestaurant(rDto, gameState));

      return true;

    } catch (error) {
      console.error('Failed to load game (corrupt save?):', error);
      // Clean up bad save
      localStorage.removeItem(this.SAVE_KEY);
      return false;
    }
  }

  private serializePizza(pizza: Pizza): PizzaDTO {
    return {
      id: pizza.id,
      name: pizza.name,
      ingredientIds: pizza.ingredients.map(i => i.id),
      salePrice: pizza.salePrice
    };
  }

  private serializeOrder(order: Order): any {
    return {
      id: order.id,
      pizza: this.serializePizza(order.pizza),
      customerId: order.customerId,
      state: order.state,
      progress: order.progress,
      maxProgress: order.maxProgress
    };
  }

  private serializeRestaurant(restaurant: Restaurant): RestaurantDTO {
    return {
      id: restaurant.id,
      reputation: {
        averageRating: restaurant.reputationSystem.averageRating,
        reviews: restaurant.reputationSystem.reviews
      },
      inventory: Array.from(restaurant.inventory.entries()),
      menu: restaurant.menu.map(p => this.serializePizza(p)),
      employees: restaurant.employees.map(e => ({
        name: e.name,
        role: e.role,
        skillLevel: e.skillLevel,
        salary: e.salary,
        gridX: e.gridX,
        gridY: e.gridY,
        state: e.state,
        assetKey: e.assetKey,
        currentOrder: e.currentOrder ? this.serializeOrder(e.currentOrder) : null,
        targetX: e.targetX,
        targetY: e.targetY,
        blockedReason: e.blockedReason
      })),
      furniture: restaurant.furniture, // PlacedFurniture is interface
      customers: restaurant.customers.map(c => ({
        id: c.id,
        gridX: c.gridX,
        gridY: c.gridY,
        state: c.state,
        targetFurnitureId: c.targetFurnitureId,
        order: c.order ? this.serializePizza(c.order) : null,
        eatingTimer: c.eatingTimer,
        hasReviewed: c.hasReviewed,
        arrivalTime: (c as any).arrivalTime,
        waitingForFoodTime: (c as any).waitingForFoodTime
      })),
      kitchenQueue: restaurant.kitchenQueue.map(o => this.serializeOrder(o)),
      readyCounter: restaurant.readyCounter.map(o => this.serializeOrder(o)),
      width: restaurant.width,
      height: restaurant.height,
      appeal: restaurant.appeal,
      grid: restaurant.grid
    };
  }

  private deserializeRestaurant(dto: RestaurantDTO, gameState: GameState): Restaurant {
    const restaurant = new Restaurant();
    restaurant.id = dto.id;
    // restaurant.width/height read-only via getters based on grid, but DTO has them for ref
    // We rely on grid or initialization.
    restaurant.appeal = dto.appeal;

    // Grid Restoration (Critical)
    if (dto.grid && Array.isArray(dto.grid) && dto.grid.length > 0) {
        restaurant.grid = dto.grid;
    } else {
        // Fallback for legacy saves or missing grid
        // Use the width/height from DTO if available, otherwise default 10x10
        const w = dto.width || 10;
        const h = dto.height || 10;
        restaurant.grid = restaurant.initializeGrid(w, h);
    }

    // Reputation
    restaurant.reputationSystem.averageRating = dto.reputation.averageRating;
    restaurant.reputationSystem.reviews = dto.reputation.reviews;

    // Inventory: Array -> Map
    restaurant.inventory = new Map(dto.inventory);

    // Menu: Reconstruct Pizzas
    restaurant.menu = dto.menu.map(pDto => {
      const ingredients = pDto.ingredientIds
        .map(id => gameState.getIngredient(id))
        .filter(i => i !== undefined) as Ingredient[];

      const pizza = new Pizza(pDto.name, ingredients, pDto.salePrice);
      pizza.id = pDto.id; // Restore ID
      return pizza;
    });

    // Employees: Reconstruct instances
    restaurant.employees = dto.employees.map(eDto => {
      const emp = new Employee(eDto.name, eDto.role, eDto.skillLevel, eDto.salary);
      emp.gridX = eDto.gridX;
      emp.gridY = eDto.gridY;
      emp.state = eDto.state;
      emp.assetKey = eDto.assetKey;
      emp.targetX = eDto.targetX;
      emp.targetY = eDto.targetY;
      emp.blockedReason = eDto.blockedReason;

      // Re-link Order if exists
      if (eDto.currentOrder) {
        emp.currentOrder = this.reconstructOrder(eDto.currentOrder, gameState);
      }
      return emp;
    });

    // Furniture: It's an array of objects/interfaces, so direct assignment is mostly fine.
    // However, if we change Furniture to a class later, this needs update.
    restaurant.furniture = dto.furniture;

    // Customers: Reconstruct instances
    restaurant.customers = dto.customers.map(cDto => {
      const customer = new Customer(cDto.id, cDto.gridX, cDto.gridY);
      customer.state = cDto.state;
      customer.targetFurnitureId = cDto.targetFurnitureId;
      customer.eatingTimer = cDto.eatingTimer;
      customer.hasReviewed = cDto.hasReviewed;

      // Restore private fields via 'any' hack
      (customer as any).arrivalTime = cDto.arrivalTime;
      (customer as any).waitingForFoodTime = cDto.waitingForFoodTime;

      if (cDto.order) {
          const ingredients = cDto.order.ingredientIds
            .map(id => gameState.getIngredient(id))
            .filter(i => i !== undefined) as Ingredient[];
          const pizza = new Pizza(cDto.order.name, ingredients, cDto.order.salePrice);
          pizza.id = cDto.order.id;
          customer.order = pizza;
      }
      return customer;
    });

    // Queues
    restaurant.kitchenQueue = dto.kitchenQueue.map(o => this.reconstructOrder(o, gameState));
    restaurant.readyCounter = dto.readyCounter.map(o => this.reconstructOrder(o, gameState));

    return restaurant;
  }

  private reconstructOrder(orderData: any, gameState: GameState): Order {
      // Reconstruct the Pizza inside the order
      const ingredients = orderData.pizza.ingredientIds
            .map((id: string) => gameState.getIngredient(id))
            .filter((i: any) => i !== undefined) as Ingredient[];

      const pizza = new Pizza(orderData.pizza.name, ingredients, orderData.pizza.salePrice);
      pizza.id = orderData.pizza.id;

      return {
          id: orderData.id,
          pizza: pizza,
          customerId: orderData.customerId,
          state: orderData.state,
          progress: orderData.progress,
          maxProgress: orderData.maxProgress
      };
  }
}
