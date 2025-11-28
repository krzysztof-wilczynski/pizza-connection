import { GameState } from '../model/GameState';
import { TimeManager } from '../systems/TimeManager';

export class HUD {
  private gameState: GameState;
  private timeManager: TimeManager;

  private displayedMoney: number;
  private canvasWidth: number = 0;

  constructor(gameState: GameState, timeManager: TimeManager) {
    this.gameState = gameState;
    this.timeManager = timeManager;
    this.displayedMoney = gameState.player.money;
  }

  public update(deltaTime: number): void {
    const targetMoney = this.gameState.player.money;
    if (this.displayedMoney !== targetMoney) {
      const diff = targetMoney - this.displayedMoney;
      // Simple lerp for smooth transition
      if (Math.abs(diff) < 1) {
        this.displayedMoney = targetMoney;
      } else {
        this.displayedMoney += diff * 0.1;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.canvasWidth = ctx.canvas.width;
    const barHeight = 60;

    // Draw Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvasWidth, barHeight);

    // Draw Money (Left)
    this.renderMoney(ctx, 20, 38);

    // Draw Reputation (Center-Left)
    this.renderReputation(ctx, 250, 38);

    // Draw Time/Date (Right)
    this.renderTime(ctx, this.canvasWidth - 20, 38);
  }

  private renderMoney(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#4caf50'; // Green
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';

    // Format money with commas (e.g. 10,000)
    const formattedMoney = Math.round(this.displayedMoney).toLocaleString('en-US');
    ctx.fillText(`$ ${formattedMoney}`, x, y);
  }

  private renderReputation(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const stars = this.gameState.player.reputation;
    const maxStars = 5;
    const starSize = 24;
    const gap = 5;

    ctx.font = '24px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < maxStars; i++) {
        const starX = x + i * (starSize + gap);
        if (i < Math.floor(stars)) {
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.fillText('★', starX, y);
        } else {
            ctx.fillStyle = '#555'; // Grey
            ctx.fillText('★', starX, y);
        }
    }
  }

  private renderTime(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const time = this.timeManager.getFormattedTime();
    const date = this.timeManager.getFormattedDate();
    const day = this.timeManager.getDayOfWeek();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';

    // Time
    ctx.font = 'bold 24px Arial';
    ctx.fillText(time, x, y - 10);

    // Date
    ctx.font = '14px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`${day}, ${date}`, x, y + 10);
  }
}
