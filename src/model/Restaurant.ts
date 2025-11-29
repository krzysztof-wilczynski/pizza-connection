import { v4 as uuidv4 } from 'uuid';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Furniture, PlacedFurniture } from './Furniture';
import { Customer } from './Customer';
import { Order } from './Order';
import { GameState } from './GameState';
import { ReputationSystem } from './ReputationSystem';
import { CustomerAISystem } from '../systems/CustomerAISystem';
import { EmployeeAISystem } from '../systems/EmployeeAISystem';
import { InteriorTile } from './Tile';
import { WallType, ZoneType } from './enums';
import { CONSTRUCTION_COSTS } from '../data/ConstructionCosts';

export class Restaurant {
  public id: string;
  public reputationSystem: ReputationSystem;
  public inventory: Map<string, number> = new Map(); // Key is ingredient ID
  public menu: Pizza[] = [];
  public employees: Employee[] = [];
  public furniture: PlacedFurniture[] = [];
  public customers: Customer[] = [];
  public kitchenQueue: Order[] = [];
  public readyCounter: Order[] = [];
  private spawnTimer: number = 0;

  public grid: InteriorTile[][];

  public appeal: number = 0; // Decoration appeal bonus

  constructor() {
    this.id = uuidv4();
    this.reputationSystem = new ReputationSystem();
    this.grid = this.initializeGrid(10, 10);
  }

  public initializeGrid(width: number, height: number): InteriorTile[][] {
    const grid: InteriorTile[][] = [];
    for (let y = 0; y < height; y++) {
      const row: InteriorTile[] = [];
      for (let x = 0; x < width; x++) {
        // Default layout: Top 3 rows Kitchen, rest Dining
        const isKitchen = y < 3;
        row.push({
          x,
          y,
          isWalkable: true,
          wallType: WallType.None,
          zone: isKitchen ? ZoneType.Kitchen : ZoneType.Dining,
          floorAsset: 'interior_floor_wood' // Default floor
        });
      }
      grid.push(row);
    }
    return grid;
  }

  // Compatibility getters
  public get width(): number {
    return this.grid[0]?.length || 0;
  }

  public get height(): number {
    return this.grid.length;
  }

  public getTile(x: number, y: number): InteriorTile | null {
    if (y < 0 || y >= this.grid.length || x < 0 || x >= this.grid[0].length) {
      return null;
    }
    return this.grid[y][x];
  }

  // --- Construction Methods ---

  public placeWall(x: number, y: number, type: WallType): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;

    // If type is None, it's actually a demolition of a wall
    if (type === WallType.None) {
      return this.removeStructure(x, y);
    }

    // Check cost
    const player = GameState.getInstance().player;
    if (player.money < CONSTRUCTION_COSTS.WALL) {
      return false;
    }

    // Apply change
    player.spendMoney(CONSTRUCTION_COSTS.WALL);
    tile.wallType = type;
    tile.isWalkable = false;
    return true;
  }

  public placeDoor(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;

    // Check if there is a wall here (excluding None and Door)
    if (tile.wallType === WallType.None || tile.wallType === WallType.Door) {
      return false;
    }

    // Check cost
    const player = GameState.getInstance().player;
    if (player.money < CONSTRUCTION_COSTS.DOOR) {
      return false;
    }

    // Apply change
    player.spendMoney(CONSTRUCTION_COSTS.DOOR);
    tile.wallType = WallType.Door;
    tile.isWalkable = true; // Doors are walkable
    return true;
  }

  public removeStructure(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;

    // Nothing to remove
    if (tile.wallType === WallType.None) {
      return false;
    }

    // Check cost
    const player = GameState.getInstance().player;
    if (player.money < CONSTRUCTION_COSTS.DEMOLISH) {
      return false;
    }

    // Apply change
    player.spendMoney(CONSTRUCTION_COSTS.DEMOLISH);
    tile.wallType = WallType.None;
    tile.isWalkable = true;
    return true;
  }

  public setZone(x: number, y: number, zone: ZoneType) {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.zone = zone;
    }
  }

  public update(deltaTime: number) {
    // Check if shop is open before spawning
    const timeManager = GameState.getInstance().timeManager;

    // Spawner Logic
    if (timeManager.isShopOpen()) {
      this.spawnTimer += deltaTime;

      // Base spawn time 5000ms.
      const ratingFactor = 0.5 + (this.reputationSystem.averageRating - 1) * 0.25;
      const adjustedSpawnTime = 5000 / ratingFactor;

      if (this.spawnTimer > adjustedSpawnTime) {
        this.spawnTimer = 0;
        this.trySpawnCustomer();
      }
    }

    // Update Employees
    this.employees.forEach(employee => {
      EmployeeAISystem.update(employee, deltaTime, this);
    });

    // Update Customers
    const customersToRemove: string[] = [];
    this.customers.forEach(customer => {
      CustomerAISystem.update(customer, deltaTime, this, customersToRemove);
    });

    this.customers = this.customers.filter(c => !customersToRemove.includes(c.id));
  }

  // --- Inventory Logic ---
  
  public hasIngredientsFor(pizza: Pizza): boolean {
    for (const ingredient of pizza.ingredients) {
        const currentAmount = this.inventory.get(ingredient.id) || 0;
        if (currentAmount < 1) return false;
    }
    return true;
  }

  public consumeIngredientsFor(pizza: Pizza): void {
    for (const ingredient of pizza.ingredients) {
        const ingredientId = ingredient.id;
        const currentAmount = this.inventory.get(ingredientId) || 0;
        this.inventory.set(ingredientId, Math.max(0, currentAmount - 1));
    }
  }

  public buyIngredient(ingredientId: string, amount: number, cost: number): boolean {
      const player = GameState.getInstance().player;
      if (player.spendMoney(cost)) {
          const current = this.inventory.get(ingredientId) || 0;
          this.inventory.set(ingredientId, current + amount);
          return true;
      }
      return false;
  }

  // --- Customer Logic ---

  private trySpawnCustomer() {
    const diningFurniture = this.furniture.filter(f => f.type === 'dining');
    const freeChairs = diningFurniture.filter(chair => {
      // Must be a chair (ID 300-399), not a table (200-299)
      if (chair.id < 300 || chair.id >= 400) return false;

      const chairId = CustomerAISystem.getFurnitureId(chair);
      const isTargeted = this.customers.some(c => c.targetFurnitureId === chairId);
      return !isTargeted;
    });

    if (freeChairs.length > 0) {
      const randomChair = freeChairs[Math.floor(Math.random() * freeChairs.length)];
      const newCustomer = new Customer(uuidv4(), 0, 0); // Spawn at entrance
      newCustomer.targetFurnitureId = CustomerAISystem.getFurnitureId(randomChair);
      this.customers.push(newCustomer);
    }
  }

  // --- Menu Management ---

  public removePizza(pizzaId: string): void {
    this.menu = this.menu.filter(p => p.id !== pizzaId);
  }

  public updatePizzaPrice(pizzaId: string, newPrice: number): void {
    const pizza = this.menu.find(p => p.id === pizzaId);
    if (pizza) {
      pizza.salePrice = newPrice;
    }
  }

  // --- Furniture Logic ---

  public addFurniture(item: Furniture, x: number, y: number): boolean {
    // 1. Check bounds and walkability of tiles
    if (x < 0 || y < 0 || x + item.width > this.width || y + item.height > this.height) {
      return false;
    }

    for (let row = 0; row < item.height; row++) {
      for (let col = 0; col < item.width; col++) {
        const tile = this.getTile(x + col, y + row);
        if (!tile || !tile.isWalkable) {
          return false; // Collision with wall or invalid tile
        }
      }
    }

    // 2. Check collision with existing furniture
    for (const placed of this.furniture) {
      // Ignore collision if either item is a Rug (ID 402)
      if (item.id === 402 || placed.id === 402) continue;

      if (
        x < placed.gridX + placed.width &&
        x + item.width > placed.gridX &&
        y < placed.gridY + placed.height &&
        y + item.height > placed.gridY
      ) {
        return false;
      }
    }

    const newFurniture: PlacedFurniture = {
      ...item,
      gridX: x,
      gridY: y
    };
    this.furniture.push(newFurniture);
    return true;
  }
}
