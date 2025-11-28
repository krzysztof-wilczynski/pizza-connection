import { v4 as uuidv4 } from 'uuid';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Furniture, PlacedFurniture } from './Furniture';
import { Customer } from './Customer';
import { CustomerState, OrderState } from './enums';
import { Order } from './Order';
import { GameState } from './GameState';
import { ReputationSystem } from './ReputationSystem';

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

    // Spawner Logic modified by Reputation and Time
    if (timeManager.isShopOpen()) {
      this.spawnTimer += deltaTime;

      // Base spawn time 5000ms.
      // Higher rating = lower spawn time (more frequent).
      // Rating 1: 5000 / 0.5 = 10000ms
      // Rating 5: 5000 / 1.5 = 3333ms
      const ratingFactor = 0.5 + (this.reputationSystem.averageRating - 1) * 0.25;
      // 1 star -> 0.5 factor
      // 3 stars -> 1.0 factor
      // 5 stars -> 1.5 factor

      const adjustedSpawnTime = 5000 / ratingFactor;

      if (this.spawnTimer > adjustedSpawnTime) {
        this.spawnTimer = 0;
        this.trySpawnCustomer();
      }
    }


    // Update Employees
    this.employees.forEach(employee => {
      employee.update(deltaTime, this);
    });

    // Update Customers
    const customersToRemove: string[] = [];
    this.customers.forEach(customer => {
      this.updateCustomer(customer, deltaTime, customersToRemove);
    });

    this.customers = this.customers.filter(c => !customersToRemove.includes(c.id));
  }

  // --- Inventory Logic (Przywrócone) ---
  
  public hasIngredientsFor(pizza: Pizza): boolean {
    // Zakładamy uproszczenie: 1 sztuka każdego składnika na pizzę
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
      const chairId = this.getFurnitureId(chair);
      const isTargeted = this.customers.some(c => c.targetFurnitureId === chairId);
      return !isTargeted;
    });

    if (freeChairs.length > 0) {
      const randomChair = freeChairs[Math.floor(Math.random() * freeChairs.length)];
      const newCustomer = new Customer(uuidv4(), 0, 0); // Spawn at entrance
      newCustomer.targetFurnitureId = this.getFurnitureId(randomChair);
      this.customers.push(newCustomer);
    }
  }

  private updateCustomer(customer: Customer, dt: number, removeList: string[]) {
    const SPEED = 0.003 * dt;

    if (customer.state === CustomerState.Arriving) {
      if (customer.targetFurnitureId !== null) {
        const targetChair = this.furniture.find(f => this.getFurnitureId(f) === customer.targetFurnitureId);
        if (targetChair) {
          const dx = targetChair.gridX - customer.gridX;
          const dy = targetChair.gridY - customer.gridY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.1) {
            customer.gridX = targetChair.gridX;
            customer.gridY = targetChair.gridY;
            customer.state = CustomerState.Seated;
          } else {
            customer.gridX += (dx / dist) * SPEED;
            customer.gridY += (dy / dist) * SPEED;
          }
        } else {
            customer.state = CustomerState.Leaving;
        }
      }
    } else if (customer.state === CustomerState.Seated) {
      if (this.menu.length > 0) {
        const randomPizza = this.menu[Math.floor(Math.random() * this.menu.length)];
        
        // Fix: Use object literal for Interface
        const newOrder: Order = {
            id: uuidv4(),
            pizza: randomPizza,
            customerId: customer.id,
            state: OrderState.Pending,
            progress: 0,
            maxProgress: 100
        };
        this.kitchenQueue.push(newOrder);

        customer.order = randomPizza; 
        console.log(`Customer ${customer.id} ordered ${randomPizza.name}`);
        customer.state = CustomerState.WaitingForFood;
        customer.startWaitingForFood();
      } else {
        customer.state = CustomerState.Leaving;
        customer.generateReview(this, false); // No menu items = bad review
      }
    } else if (customer.state === CustomerState.Eating) {
      customer.eatingTimer -= dt;
      if (customer.eatingTimer <= 0) {
        if (customer.order) {
            GameState.getInstance().player.addMoney(customer.order.price);
        }
        customer.state = CustomerState.Leaving;
        customer.generateReview(this, true); // Finished eating = review
        customer.targetFurnitureId = null; 
      }
    } else if (customer.state === CustomerState.Leaving) {
      // Ensure review is generated if they are leaving for other reasons (e.g. timeout)
      // Note: In current logic, leaving usually comes from Eating or NoChair/NoMenu.
      // But if we add "Waiting too long" logic later, this ensures it's covered.
      if (!customer.hasReviewed) {
          customer.generateReview(this, false);
      }

      const targetX = 0; 
      const targetY = 0;
      const dx = targetX - customer.gridX;
      const dy = targetY - customer.gridY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        removeList.push(customer.id);
      } else {
        customer.gridX += (dx / dist) * SPEED;
        customer.gridY += (dy / dist) * SPEED;
      }
    }
  }

  private getFurnitureId(f: PlacedFurniture): number {
      return f.gridX * 1000 + f.gridY;
  }

  // --- Furniture Logic ---

  public getTile(x: number, y: number): { type: string } | null {
      // Stub method for collision detection needed by InteriorView
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
      return { type: 'floor' }; // Default to floor for now
  }

  // --- Menu Management ---

  public removePizza(pizzaId: string): void {
    this.menu = this.menu.filter(p => p.id !== pizzaId);
    // Also remove any pending orders for this pizza?
    // Maybe not needed if we assume orders in progress finish normally.
    // But new customers won't order it.
  }

  public updatePizzaPrice(pizzaId: string, newPrice: number): void {
    const pizza = this.menu.find(p => p.id === pizzaId);
    if (pizza) {
      pizza.salePrice = newPrice;
    }
  }

  // --- Furniture Logic ---

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
