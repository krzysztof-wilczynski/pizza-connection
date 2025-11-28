import { EmployeeRole, EmployeeState, OrderState, CustomerState } from './enums';
import { Restaurant } from './Restaurant';
import { Order } from './Order';

export class Employee {
  public gridX: number;
  public gridY: number;
  public state: EmployeeState;
  public assetKey: string;
  public currentOrder: Order | null = null;
  public targetX: number = -1;
  public targetY: number = -1;
  public blockedReason: string | null = null;

  constructor(
    public name: string,
    public role: EmployeeRole,
    public skillLevel: number,
    public salary: number
  ) {
    this.gridX = -1;
    this.gridY = -1;
    this.state = EmployeeState.Idle;
    this.assetKey = role === EmployeeRole.Chef ? 'people_chef' : 'people_waiter';
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
      // 1. Check for Pending Orders
      const pendingOrder = restaurant.kitchenQueue.find(o => o.state === OrderState.Pending);
      
      if (pendingOrder) {
        // 2. Supply Chain Check (Nowa logika!)
        if (!restaurant.hasIngredientsFor(pendingOrder.pizza)) {
            // Cannot cook, ignore this order or wait
            this.blockedReason = 'Brak składników!';
            return; 
        }

        // Reset reason if we have ingredients
        this.blockedReason = null;

        // 3. Find Available Oven
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
          // Commit to order
          this.currentOrder = pendingOrder;
          restaurant.consumeIngredientsFor(pendingOrder.pizza); // Consume ingredients NOW
          pendingOrder.state = OrderState.Cooking;
          
          this.state = EmployeeState.Walking;
          this.targetX = availableOven.gridX;
          this.targetY = availableOven.gridY;
        }
      } else {
        // No pending orders
        this.blockedReason = null;
      }
    } else if (this.state === EmployeeState.Walking) {
      this.moveTowardsTarget(SPEED);
      if (this.atTarget()) {
         if (this.currentOrder && this.currentOrder.state === OrderState.Cooking) {
           this.state = EmployeeState.Working;
         } else {
           this.state = EmployeeState.Idle;
         }
      }
    } else if (this.state === EmployeeState.Working) {
      if (this.currentOrder) {
        this.currentOrder.progress += (dt * 0.05); 
        if (this.currentOrder.progress >= this.currentOrder.maxProgress) {
          this.currentOrder.progress = this.currentOrder.maxProgress;
          this.currentOrder.state = OrderState.Ready;

          restaurant.readyCounter.push(this.currentOrder);
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
      const readyOrder = restaurant.readyCounter.find(o => o.state === OrderState.Ready);
      if (readyOrder) {
        // Assumption: Kitchen/Counter is where the Chef is, or any 'kitchen' furniture
        // For simplicity, finding any kitchen furniture to pickup from
        const counter = restaurant.furniture.find(f => f.type === 'kitchen');
        if (counter) {
            this.state = EmployeeState.Walking;
            this.targetX = counter.gridX;
            this.targetY = counter.gridY;
            // Note: We are NOT taking the order yet, just walking there
        }
      }
    } else if (this.state === EmployeeState.Walking) {
      this.moveTowardsTarget(SPEED);
      
      if (this.atTarget()) {
        // --- Arrived at Destination ---
        
        // Scenario A: Arrived at Kitchen (Pick up food)
        if (!this.currentOrder) {
            const readyOrder = restaurant.readyCounter.find(o => o.state === OrderState.Ready);
            if (readyOrder) {
                this.currentOrder = readyOrder;
                // Remove from counter immediately so others don't take it
                restaurant.readyCounter = restaurant.readyCounter.filter(o => o.id !== readyOrder.id);
                
                const customer = restaurant.customers.find(c => c.id === readyOrder.customerId);
                if (customer) {
                    this.targetX = customer.gridX;
                    this.targetY = customer.gridY;
                    // Stay in Walking state, just changed target
                } else {
                    // Customer vanished? Abort.
                    this.currentOrder = null;
                    this.state = EmployeeState.Idle;
                }
            } else {
                // Someone else took it
                this.state = EmployeeState.Idle;
            }
        } 
        // Scenario B: Arrived at Customer (Deliver food)
        else {
             const customer = restaurant.customers.find(c => c.id === this.currentOrder!.customerId);
             if (customer && customer.state === CustomerState.WaitingForFood) {
                 customer.state = CustomerState.Eating;
                 customer.eatingTimer = 3000;
                 this.currentOrder.state = OrderState.Served;
                 this.currentOrder = null;
             }
             this.state = EmployeeState.Idle;
        }
      }
    }
  }

  // Helper for movement
  private moveTowardsTarget(speed: number) {
      const dx = this.targetX - this.gridX;
      const dy = this.targetY - this.gridY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.1) {
        this.gridX += (dx / dist) * speed;
        this.gridY += (dy / dist) * speed;
      }
  }

  private atTarget(): boolean {
      const dx = this.targetX - this.gridX;
      const dy = this.targetY - this.gridY;
      return Math.sqrt(dx * dx + dy * dy) < 0.1;
  }
}
