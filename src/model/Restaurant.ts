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

  public width: number = 10;
  public height: number = 10;

  public appeal: number = 0; // Decoration appeal bonus

  constructor() {
    this.id = uuidv4();
    this.reputationSystem = new ReputationSystem();
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
        const currentAmount = this.inventory.get(ingredient.id) || 0;
        this.inventory.set(ingredient.id, Math.max(0, currentAmount - 1));
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

  public getTile(x: number, y: number): { type: string } | null {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
      return { type: 'floor' };
  }

  public addFurniture(item: Furniture, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x + item.width > this.width || y + item.height > this.height) {
      return false;
    }

    for (const placed of this.furniture) {
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
