import { GameState } from '../model/GameState';
import { TimeManager } from '../systems/TimeManager';

export class HUD {
  private gameState: GameState;
  private timeManager: TimeManager;

  private displayedMoney: number;

  // HTML Elements
  private moneyEl: HTMLElement | null;
  private repEl: HTMLElement | null;
  private timeEl: HTMLElement | null;
  private dateEl: HTMLElement | null;

  constructor(gameState: GameState, timeManager: TimeManager) {
    this.gameState = gameState;
    this.timeManager = timeManager;
    this.displayedMoney = gameState.player.money;

    this.moneyEl = document.getElementById('hud-money');
    this.repEl = document.getElementById('hud-reputation');
    this.timeEl = document.getElementById('hud-time');
    this.dateEl = document.getElementById('hud-date');
  }

  public update(deltaTime: number): void {
    // Money Lerp
    const targetMoney = this.gameState.player.money;
    if (this.displayedMoney !== targetMoney) {
      const diff = targetMoney - this.displayedMoney;
      if (Math.abs(diff) < 1) {
        this.displayedMoney = targetMoney;
      } else {
        this.displayedMoney += diff * 0.1;
      }
    }

    this.updateHTML();
  }

  private updateHTML(): void {
      if (this.moneyEl) {
          this.moneyEl.innerText = `$${Math.round(this.displayedMoney).toLocaleString('en-US')}`;
      }

      if (this.repEl) {
          const stars = Math.floor(this.gameState.player.reputation);
          let starStr = '';
          for(let i=0; i<5; i++) {
              starStr += i < stars ? '★' : '☆';
          }
          this.repEl.innerText = starStr;
      }

      if (this.timeEl) {
          this.timeEl.innerText = this.timeManager.getFormattedTime();
      }

      if (this.dateEl) {
          this.dateEl.innerText = `${this.timeManager.getDayOfWeek()}, ${this.timeManager.getFormattedDate()}`;
      }
  }

  public render(ctx: CanvasRenderingContext2D): void {
      // No-op: HUD is now HTML-based
  }
}
