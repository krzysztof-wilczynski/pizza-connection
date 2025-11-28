import { Customer } from '../model/Customer';
import { Restaurant } from '../model/Restaurant';
import { CustomerState, OrderState } from '../model/enums';
import { Order } from '../model/Order';
import { GameState } from '../model/GameState';
import { v4 as uuidv4 } from 'uuid';
import { PlacedFurniture } from '../model/Furniture';

export class CustomerAISystem {
  private static readonly SPEED = 0.003;

  public static update(customer: Customer, dt: number, restaurant: Restaurant, removeList: string[]): void {
    // Update bubble timer
    if (customer.bubbleTimer > 0) {
      customer.bubbleTimer -= dt / 1000; // dt is usually in ms? No, check caller.
      // Game usually uses dt in ms from requestAnimationFrame?
      // InteriorView.update passes deltaTime.
      // Let's verify standard unit. If dt is ~16 (ms), then dividing by 1000 is correct for seconds.
      // If dt is ~0.016 (seconds), then no division.
      // Looking at moveTowards: SPEED = 0.003.
      // If dt=16, move = 0.003 * 16 = 0.048 tiles/frame. 60 frames = 2.8 tiles. Reasonable.
      // So dt is likely milliseconds.
      // Bubble lifetime is 3.0 (seconds).
      if (customer.bubbleTimer <= 0) {
        customer.bubbleText = null;
      }
    }

    if (customer.state === CustomerState.Arriving) {
      CustomerAISystem.handleArriving(customer, dt, restaurant);
    } else if (customer.state === CustomerState.Seated) {
      CustomerAISystem.handleSeated(customer, restaurant);
    } else if (customer.state === CustomerState.Eating) {
      CustomerAISystem.handleEating(customer, dt, restaurant);
    } else if (customer.state === CustomerState.Leaving) {
      CustomerAISystem.handleLeaving(customer, dt, restaurant, removeList);
    }
  }

  private static handleArriving(customer: Customer, dt: number, restaurant: Restaurant): void {
    if (customer.targetFurnitureId !== null) {
      const targetChair = restaurant.furniture.find(f => CustomerAISystem.getFurnitureId(f) === customer.targetFurnitureId);
      if (targetChair) {
        if (CustomerAISystem.moveTowards(customer, targetChair.gridX, targetChair.gridY, dt)) {
          customer.state = CustomerState.Seated;
        }
      } else {
        customer.state = CustomerState.Leaving;
      }
    }
  }

  private static handleSeated(customer: Customer, restaurant: Restaurant): void {
    if (restaurant.menu.length > 0) {
      const randomPizza = restaurant.menu[Math.floor(Math.random() * restaurant.menu.length)];

      const newOrder: Order = {
        id: uuidv4(),
        pizza: randomPizza,
        customerId: customer.id,
        state: OrderState.Pending,
        progress: 0,
        maxProgress: 100
      };
      restaurant.kitchenQueue.push(newOrder);

      customer.order = randomPizza;
      console.log(`Customer ${customer.id} ordered ${randomPizza.name}`);
      customer.state = CustomerState.WaitingForFood;
      customer.startWaitingForFood();
    } else {
      customer.state = CustomerState.Leaving;
      customer.generateReview(restaurant, false); // No menu items = bad review
    }
  }

  private static handleEating(customer: Customer, dt: number, restaurant: Restaurant): void {
    customer.eatingTimer -= dt;
    if (customer.eatingTimer <= 0) {
      if (customer.order) {
        GameState.getInstance().player.addMoney(customer.order.salePrice);
      }
      customer.state = CustomerState.Leaving;
      customer.generateReview(restaurant, true); // Finished eating = review
      customer.targetFurnitureId = null;
    }
  }

  private static handleLeaving(customer: Customer, dt: number, restaurant: Restaurant, removeList: string[]): void {
    if (!customer.hasReviewed) {
      customer.generateReview(restaurant, false);
    }

    if (CustomerAISystem.moveTowards(customer, 0, 0, dt)) {
      removeList.push(customer.id);
    }
  }

  private static moveTowards(customer: Customer, targetX: number, targetY: number, dt: number): boolean {
    const dx = targetX - customer.gridX;
    const dy = targetY - customer.gridY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) {
      customer.gridX = targetX;
      customer.gridY = targetY;
      return true;
    } else {
      const speed = CustomerAISystem.SPEED * dt;
      customer.gridX += (dx / dist) * speed;
      customer.gridY += (dy / dist) * speed;
      return false;
    }
  }

  public static getFurnitureId(f: PlacedFurniture): number {
    return f.gridX * 1000 + f.gridY;
  }
}
