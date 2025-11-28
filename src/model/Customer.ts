import { CustomerState } from './enums';
import { Pizza } from './Pizza';
import { GameState } from './GameState';
import { TimeManager } from '../systems/TimeManager';
import { Restaurant } from './Restaurant';

export class Customer {
  id: string;
  state: CustomerState;
  gridX: number;
  gridY: number;
  targetFurnitureId: number | null;
  order: Pizza | null;
  eatingTimer: number;
  assetKey: string;

  // Review System Tracking
  private arrivalTime: number = 0; // Game time in minutes
  private waitingForFoodTime: number = 0; // Start of waiting
  public hasReviewed: boolean = false;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.state = CustomerState.Arriving;
    this.gridX = x;
    this.gridY = y;
    this.targetFurnitureId = null;
    this.order = null;
    this.eatingTimer = 0;
    this.assetKey = 'people_customer';

    // Capture arrival time
    const tm = GameState.getInstance().timeManager;
    this.arrivalTime = tm.day * 24 * 60 + tm.hour * 60 + tm.minute;
  }

  public generateReview(restaurant: Restaurant, success: boolean): void {
      if (this.hasReviewed) return;
      this.hasReviewed = true;

      const tm = GameState.getInstance().timeManager;
      const leaveTime = tm.day * 24 * 60 + tm.hour * 60 + tm.minute;

      let rating = 3;
      let comments: string[] = [];

      if (!success) {
          rating = 1;
          comments.push("Wyszedłem głodny!");
      } else {
          // Success case
          rating = 4; // Base positive
          comments.push("Dobra pizza.");

          // Wait time check
          // Note: Realistically we should track time between Seated and Eating.
          // For now, let's look at total time spent vs expected.
          // Or we assume 'waitingForFoodTime' was set when order was placed.

          if (this.waitingForFoodTime > 0) {
             const waitEnd = leaveTime;
             const waitDuration = waitEnd - this.waitingForFoodTime;

             if (waitDuration > 30) {
                 rating -= 1;
                 comments.push("Czekałem wieki!");
             } else {
                 rating += 1;
                 comments.push("Szybka obsługa.");
             }
          }

          // Price/Quality check
          if (this.order) {
              const valueRatio = this.order.salePrice / (this.order.salePrice * 0.5 + 5); // Simplified value logic
              if (valueRatio < 1.0) {
                  rating += 1;
                  comments.push("Świetna cena!");
              } else if (valueRatio > 2.0) {
                  rating -= 1;
                  comments.push("Drogo.");
              }
          }

          // Decoration appeal
          if (restaurant.appeal > 10) {
              rating += 1;
              comments.push("Ładne wnętrze.");
          }
      }

      // Clamp rating
      rating = Math.max(1, Math.min(5, rating));

      restaurant.reputationSystem.addReview({
          rating: rating,
          comment: comments.join(" "),
          timestamp: tm.getTimeString()
      });
  }

  public startWaitingForFood(): void {
      const tm = GameState.getInstance().timeManager;
      this.waitingForFoodTime = tm.day * 24 * 60 + tm.hour * 60 + tm.minute;
  }
}
