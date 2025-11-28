import { Furniture } from '../../model/Furniture';
import { AssetManager } from '../../systems/AssetManager';
import { GameState } from '../../model/GameState';
import { FURNITURE_CATALOG } from '../../data/FurnitureCatalog';

const FURNITURE_PANEL_WIDTH = 250;
const FURNITURE_ITEM_HEIGHT = 60;
const FURNITURE_ITEM_MARGIN = 10;

export class FurniturePanel {
  private panelX: number;
  private panelY: number;
  private height: number;
  private assetManager: AssetManager;

  constructor(canvasWidth: number, canvasHeight: number, assetManager: AssetManager) {
    this.panelX = canvasWidth - FURNITURE_PANEL_WIDTH;
    this.panelY = 40; // Below tabs
    this.height = canvasHeight - this.panelY;
    this.assetManager = assetManager;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.panelX, this.panelY, FURNITURE_PANEL_WIDTH, this.height);

    const playerMoney = GameState.getInstance().player.money;

    FURNITURE_CATALOG.forEach((item, index) => {
      const itemY = this.panelY + (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * index + FURNITURE_ITEM_MARGIN;

      // Item Background
      ctx.fillStyle = '#555';
      ctx.fillRect(this.panelX + FURNITURE_ITEM_MARGIN, itemY, FURNITURE_PANEL_WIDTH - 2 * FURNITURE_ITEM_MARGIN, FURNITURE_ITEM_HEIGHT);

      // Icon
      const img = this.assetManager.getAsset(item.assetKey);
      const iconX = this.panelX + FURNITURE_ITEM_MARGIN * 2;
      const iconY = itemY + FURNITURE_ITEM_MARGIN;
      const iconSize = 40;

      if (img && img.naturalWidth > 0) {
        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
      } else {
        ctx.fillStyle = item.color;
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
      }

      const canAfford = playerMoney >= item.price;
      ctx.fillStyle = canAfford ? 'white' : '#ff4444';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.name, this.panelX + FURNITURE_ITEM_MARGIN * 3 + 40, itemY + FURNITURE_ITEM_MARGIN);

      ctx.font = '14px Arial';
      ctx.fillStyle = canAfford ? '#ccc' : '#ff4444';
      ctx.fillText(`$${item.price}`, this.panelX + FURNITURE_ITEM_MARGIN * 3 + 40, itemY + FURNITURE_ITEM_MARGIN + 20);
    });
  }

  public handleClick(x: number, y: number): Furniture | null {
    if (x < this.panelX) return null;

    let selected: Furniture | null = null;
    FURNITURE_CATALOG.forEach((item, i) => {
      const itemY = this.panelY + (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * i + FURNITURE_ITEM_MARGIN;
      if (y >= itemY && y <= itemY + FURNITURE_ITEM_HEIGHT) {
        selected = { ...item };
      }
    });
    return selected;
  }
}
