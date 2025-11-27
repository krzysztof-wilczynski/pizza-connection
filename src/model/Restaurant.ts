import { v4 as uuidv4 } from 'uuid';
import { Ingredient } from './Ingredient';
import { Pizza } from './Pizza';
import { Employee } from './Employee';
import { Furniture, PlacedFurniture } from './Furniture';
import { Customer, CustomerState } from './Customer';
import { Order } from './Order';
import { GameState } from './GameState';

export class Restaurant {
  public id: string;
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

  constructor() {
    this.id = uuidv4();
  }

  public update(deltaTime: number) {
    // Spawner
    this.spawnTimer += deltaTime;
    if (this.spawnTimer > 5000) { // Every 5 seconds
      this.spawnTimer = 0;
      this.trySpawnCustomer();
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

  private trySpawnCustomer() {
    // Find free chair (furniture type 'dining' and not target of any customer)
    const diningFurniture = this.furniture.filter(f => f.type === 'dining');
    const freeChairs = diningFurniture.filter(chair => {
      // Chair is free if no customer is targeting it
      // We use a pseudo-ID composed of grid coordinates to identify unique chairs
      const chairId = this.getFurnitureId(chair);
      const isTargeted = this.customers.some(c => c.targetFurnitureId === chairId);
      return !isTargeted;
    });

    if (freeChairs.length > 0) {
      const randomChair = freeChairs[Math.floor(Math.random() * freeChairs.length)];
      // Spawn at entrance (0,0) or some edge. Let's say 0,0 is entrance for now.
      const newCustomer = new Customer(uuidv4(), 0, 0);
      newCustomer.targetFurnitureId = this.getFurnitureId(randomChair);
      this.customers.push(newCustomer);
    }
  }

  private updateCustomer(customer: Customer, dt: number, removeList: string[]) {
    const SPEED = 0.003 * dt; // Adjust speed as needed

    if (customer.state === CustomerState.Arriving) {
      if (customer.targetFurnitureId !== null) {
        const targetChair = this.furniture.find(f => this.getFurnitureId(f) === customer.targetFurnitureId);
        if (targetChair) {
          // Move towards chair
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
            // Chair gone? Leave.
            customer.state = CustomerState.Leaving;
        }
      }
    } else if (customer.state === CustomerState.Seated) {
      // Order logic
      if (this.menu.length > 0) {
        const randomPizza = this.menu[Math.floor(Math.random() * this.menu.length)];
        // Create Order
        const newOrder = new Order(uuidv4(), randomPizza, customer.id, 'Pending', 0);
        this.kitchenQueue.push(newOrder);

        customer.order = randomPizza; // Keep reference to what they ordered (optional, but good for UI)
        console.log(`Customer ${customer.id} ordered ${randomPizza.name} -> Queue size: ${this.kitchenQueue.length}`);
        customer.state = CustomerState.WaitingForFood;
      } else {
        // No menu, leave
        customer.state = CustomerState.Leaving;
      }
    } else if (customer.state === CustomerState.WaitingForFood) {
      // Logic handled by Waiter (or if we want a timeout here)
    } else if (customer.state === CustomerState.Eating) {
      customer.eatingTimer -= dt;
      if (customer.eatingTimer <= 0) {
        // Finished eating
        if (customer.order) {
            GameState.getInstance().player.addMoney(customer.order.price);
        }
        customer.state = CustomerState.Leaving;
        customer.targetFurnitureId = null; // Free up the chair
      }
    } else if (customer.state === CustomerState.Leaving) {
      // Move to exit (0,0)
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
      // Unique ID based on position (assuming max 100x100 grid)
      return f.gridX * 1000 + f.gridY;
  }

  public addFurniture(item: Furniture, x: number, y: number): boolean {
    // Boundary check (assuming 10x10 grid based on InteriorView logic)
    if (x < 0 || y < 0 || x + item.width > this.width || y + item.height > this.height) {
      return false;
    }

    // Collision check
    for (const placed of this.furniture) {
      // AABB Collision detection
      if (
        x < placed.gridX + placed.width &&
        x + item.width > placed.gridX &&
        y < placed.gridY + placed.height &&
        y + item.height > placed.gridY
      ) {
        return false;
      }
    }

    // Add furniture
    const newFurniture: PlacedFurniture = {
      ...item,
      gridX: x,
      gridY: y
    };
    this.furniture.push(newFurniture);
    return true;
  }
}
