import { EmployeeRole, EmployeeState, CustomerState, OrderState } from './enums';
import { Restaurant } from './Restaurant';
import { Order } from './Order';
import { Customer } from './Customer';

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
      const pendingOrder = restaurant.kitchenQueue.find(o => o.state === OrderState.Pending);
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
          pendingOrder.state = OrderState.Cooking;
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
        if (this.currentOrder && this.currentOrder.state === OrderState.Cooking) {
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
        if (this.currentOrder.progress >= this.currentOrder.maxProgress) {
          this.currentOrder.progress = this.currentOrder.maxProgress;
          this.currentOrder.state = OrderState.Ready;

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
      // Check ready counter for orders that are NOT being delivered yet (implicit by 'Ready' state check,
      // since we change it immediately or if we use Delivered state)
      // Actually, plan says: "Waiters pick up Ready orders... (Simplify: As soon as they reach counter...)"
      // User Logic: "Jeśli `Idle` i `restaurant.readyCounter` ma element -> Idź do lady (tam gdzie pizza)."
      // Simplification: "Jak dojdzie do lady, natychmiast 'bierze' pizzę i idzie do klienta"

      const readyOrder = restaurant.readyCounter.find(o => o.state === OrderState.Ready);
      if (readyOrder) {
        // We need to target the counter first?
        // User instructions: "Zmień stan na Walking do lady".
        // Where is the counter? Maybe 'kitchen' type or separate 'counter' type?
        // Current 'kitchen' furniture serves as oven. Let's assume for now they walk to the Chef's position or the 'kitchen' block.
        // Let's find ANY kitchen block for pickup.
        const counter = restaurant.furniture.find(f => f.type === 'kitchen');

        if (counter) {
            this.state = EmployeeState.Walking;
            this.targetX = counter.gridX;
            this.targetY = counter.gridY;

            // We "reserve" the order so other waiters don't run for it?
            // The user didn't specify strict reservation logic for walking to counter, but for robustness:
            // Let's just walk there. The "pick up" happens when we arrive.
            // Problem: If 2 waiters walk, first one takes it. Second one arrives and finds nothing -> Idle.
            // Optimization: Maybe target the specific order? But order doesn't have a position.

            // Let's just store we are going for *an* order.
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

        // Check what we are doing based on currentOrder or lack thereof

        // 1. Arrived at Counter (no order yet)
        if (!this.currentOrder) {
            // Try to pick up
            const readyOrder = restaurant.readyCounter.find(o => o.state === OrderState.Ready);
            if (readyOrder) {
                // Pick up
                this.currentOrder = readyOrder;
                // readyOrder.state = OrderState.Served; // Wait, "Served" is when delivered? Or "Delivering"?
                // User didn't specify "Delivering" state in Priority 1, only Pending, Cooking, Ready, Served.
                // So we keep it as Ready or remove from counter?
                // User says: "Jak dojdzie do klienta: Usuń order z systemu."
                // So while walking to customer, it's technically still in system?
                // Let's remove from readyCounter NOW to prevent others from taking it.
                restaurant.readyCounter = restaurant.readyCounter.filter(o => o.id !== readyOrder.id);

                // Find Customer
                const customer = restaurant.customers.find(c => c.id === readyOrder.customerId);
                if (customer) {
                    this.targetX = customer.gridX;
                    this.targetY = customer.gridY;
                    this.state = EmployeeState.Walking; // Keep walking, new target
                } else {
                    // Customer gone
                    this.currentOrder = null;
                    this.state = EmployeeState.Idle;
                }
            } else {
                // Too late, someone took it
                this.state = EmployeeState.Idle;
            }
        }
        // 2. Arrived at Customer (has order)
        else {
             const customer = restaurant.customers.find(c => c.id === this.currentOrder!.customerId);
             if (customer && customer.state === CustomerState.WaitingForFood) {
                 customer.state = CustomerState.Eating;
                 customer.eatingTimer = 3000;

                 // Order is done
                 this.currentOrder.state = OrderState.Served;
                 this.currentOrder = null;
                 this.state = EmployeeState.Idle;
             } else {
                 // Customer gone or state changed
                 this.currentOrder = null;
                 this.state = EmployeeState.Idle;
             }
        }
      } else {
        this.gridX += (dx / dist) * SPEED;
        this.gridY += (dy / dist) * SPEED;
      }
    }
  }
}
