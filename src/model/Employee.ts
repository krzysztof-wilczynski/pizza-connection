import { EmployeeRole, EmployeeState } from './enums';
import { Restaurant } from './Restaurant';
import { Order } from './Order';
import { Customer, CustomerState } from './Customer';

export class Employee {
  public gridX: number;
  public gridY: number;
  public state: EmployeeState;
  public assetKey: string;
  public currentOrder: Order | null = null;
  public targetX: number = -1;
  public targetY: number = -1;

  constructor(
    public name: string,
    public role: EmployeeRole,
    public skillLevel: number,
    public salary: number
  ) {
    this.gridX = -1;
    this.gridY = -1;
    this.state = EmployeeState.Idle;

    // Default asset key based on role
    this.assetKey = role === EmployeeRole.Chef ? 'chef' : 'waiter';
  }

  public update(deltaTime: number, restaurant: Restaurant) {
    if (this.role === EmployeeRole.Chef) {
      this.updateChef(deltaTime, restaurant);
    } else if (this.role === EmployeeRole.Waiter) {
      this.updateWaiter(deltaTime, restaurant);
    }
  }

  private updateChef(dt: number, restaurant: Restaurant) {
    const SPEED = 0.003 * dt;

    if (this.state === EmployeeState.Idle) {
      // Find Pending order
      const pendingOrder = restaurant.kitchenQueue.find(o => o.state === 'Pending');
      if (pendingOrder) {
        // Find oven that is not targeted by another chef
        const ovens = restaurant.furniture.filter(f => f.type === 'kitchen');
        const availableOven = ovens.find(oven => {
          const isTargeted = restaurant.employees.some(e =>
            e.role === EmployeeRole.Chef &&
            e !== this &&
            e.targetX === oven.gridX &&
            e.targetY === oven.gridY
          );
          return !isTargeted;
        });

        if (availableOven) {
          this.currentOrder = pendingOrder;
          pendingOrder.state = 'Cooking';
          this.state = EmployeeState.Walking;
          this.targetX = availableOven.gridX;
          this.targetY = availableOven.gridY;
        }
      }
    } else if (this.state === EmployeeState.Walking) {
      // Move to target
      const dx = this.targetX - this.gridX;
      const dy = this.targetY - this.gridY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        this.gridX = this.targetX;
        this.gridY = this.targetY;
        // If we were walking to cook
        if (this.currentOrder && this.currentOrder.state === 'Cooking') {
           this.state = EmployeeState.Working;
        }
      } else {
        this.gridX += (dx / dist) * SPEED;
        this.gridY += (dy / dist) * SPEED;
      }
    } else if (this.state === EmployeeState.Working) {
      // Cook
      if (this.currentOrder) {
        this.currentOrder.progress += (dt * 0.05); // Cooking speed
        if (this.currentOrder.progress >= 100) {
          this.currentOrder.progress = 100;
          this.currentOrder.state = 'Ready';

          // Move to ready counter
          restaurant.readyCounter.push(this.currentOrder);
          // Remove from kitchen queue
          restaurant.kitchenQueue = restaurant.kitchenQueue.filter(o => o.id !== this.currentOrder!.id);

          this.currentOrder = null;
          this.state = EmployeeState.Idle;
        }
      } else {
        this.state = EmployeeState.Idle;
      }
    }
  }

  private updateWaiter(dt: number, restaurant: Restaurant) {
    const SPEED = 0.003 * dt;

    if (this.state === EmployeeState.Idle) {
      // Check ready counter for orders that are NOT being delivered yet
      const readyOrder = restaurant.readyCounter.find(o => o.state === 'Ready');
      if (readyOrder) {
        // Take it and mark as Delivering immediately to prevent race conditions
        readyOrder.state = 'Delivering';
        this.currentOrder = readyOrder;

        // Find customer
        const customer = restaurant.customers.find(c => c.id === readyOrder.customerId);
        if (customer) {
            this.state = EmployeeState.Walking;
            this.targetX = customer.gridX;
            this.targetY = customer.gridY;
        } else {
            // Customer left? Discard order
             restaurant.readyCounter = restaurant.readyCounter.filter(o => o.id !== readyOrder.id);
             this.currentOrder = null;
        }
      }
    } else if (this.state === EmployeeState.Walking) {
       // Move to target (Customer)
      const dx = this.targetX - this.gridX;
      const dy = this.targetY - this.gridY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        this.gridX = this.targetX;
        this.gridY = this.targetY;

        // Delivered
        if (this.currentOrder) {
             const customer = restaurant.customers.find(c => c.id === this.currentOrder!.customerId);
             if (customer && customer.state === CustomerState.WaitingForFood) {
                 customer.state = CustomerState.Eating;
                 customer.eatingTimer = 3000;
                 this.currentOrder.state = 'Served';

                 // Remove from ready counter
                 restaurant.readyCounter = restaurant.readyCounter.filter(o => o.id !== this.currentOrder!.id);
                 this.currentOrder = null;
                 this.state = EmployeeState.Idle;
             } else {
                 // Customer gone or state changed
                 restaurant.readyCounter = restaurant.readyCounter.filter(o => o.id !== this.currentOrder!.id);
                 this.currentOrder = null;
                 this.state = EmployeeState.Idle;
             }
        } else {
            this.state = EmployeeState.Idle;
        }
      } else {
        this.gridX += (dx / dist) * SPEED;
        this.gridY += (dy / dist) * SPEED;
      }
    }
  }
}
