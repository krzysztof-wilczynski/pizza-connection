import { CustomerState } from './enums';
import { Pizza } from './Pizza';
import { GameState } from './GameState';
import { TimeManager } from '../systems/TimeManager';
import { Restaurant } from './Restaurant';
import { NotificationManager } from '../systems/NotificationManager';

export class Customer {
  id: string;
  state: CustomerState;
  gridX: number;
  gridY: number;
  targetFurnitureId: number | null;
  order: Pizza | null;
  eatingTimer: number;
  assetKey: string;

  // Visual Bubble State
  public bubbleText: string | null = null;
  public bubbleTimer: number = 0;
  public bubbleColor: string = '#FFF';

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
      let shortReaction = ""; // For bubble

      if (!success) {
          rating = 1;
          comments.push("Wyszedłem głodny!");
          shortReaction = "Wyszedłem głodny!";
      } else {
          // Success case
          rating = 4; // Base positive
          comments.push("Dobra pizza.");
          shortReaction = "Dobra pizza.";

          // Wait time check
          if (this.waitingForFoodTime > 0) {
             const waitEnd = leaveTime;
             const waitDuration = waitEnd - this.waitingForFoodTime;

             if (waitDuration > 30) {
                 rating -= 1;
                 comments.push("Czekałem wieki!");
                 shortReaction = "Za długo...";
             } else {
                 rating += 1;
                 comments.push("Szybka obsługa.");
                 shortReaction = "Szybko!";
             }
          }

          // Price/Quality check
          if (this.order) {
              const valueRatio = this.order.salePrice / (this.order.salePrice * 0.5 + 5); // Simplified value logic
              if (valueRatio < 1.0) {
                  rating += 1;
                  comments.push("Świetna cena!");
                  shortReaction = "Tanio!";
              } else if (valueRatio > 2.0) {
                  rating -= 1;
                  comments.push("Drogo.");
                  shortReaction = "Drożyzna!";
              }
          }

          // Decoration appeal
          if (restaurant.appeal > 10) {
              rating += 1;
              comments.push("Ładne wnętrze.");
              // Don't necessarily override shortReaction here unless it's the main point
          }
      }

      // Clamp rating
      rating = Math.max(1, Math.min(5, rating));

      const fullComment = comments.join(" ");

      // 1. System Notification
      NotificationManager.getInstance().log(
          `Nowa opinia: ${rating}/5 - "${fullComment}"`,
          rating >= 3 ? 'success' : 'error'
      );

      // 2. Add to Reputation System
      restaurant.reputationSystem.addReview({
          rating: rating,
          comment: fullComment,
          timestamp: tm.getTimeString()
      });

      // 3. Trigger Visual Bubble
      this.bubbleText = shortReaction;
      this.bubbleTimer = 3.0; // 3 seconds
      this.bubbleColor = rating >= 3 ? '#2ecc71' : '#e74c3c';
  }

  public startWaitingForFood(): void {
      const tm = GameState.getInstance().timeManager;
      this.waitingForFoodTime = tm.day * 24 * 60 + tm.hour * 60 + tm.minute;
  }
}
