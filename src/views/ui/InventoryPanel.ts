import { INGREDIENT_DEFINITIONS } from '../../data/ingredientDefinitions';
import { GameState } from '../../model/GameState';
import { Restaurant } from '../../model/Restaurant';

const INVENTORY_PANEL_WIDTH = 250;
const INVENTORY_ITEM_HEIGHT = 70;
const INVENTORY_ITEM_MARGIN = 10;

export class InventoryPanel {
  private panelX: number;
  private panelY: number;
  private height: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.panelX = canvasWidth - INVENTORY_PANEL_WIDTH;
    this.panelY = 40;
    this.height = canvasHeight - this.panelY;
  }

  public render(ctx: CanvasRenderingContext2D, restaurant: Restaurant): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.panelX, this.panelY, INVENTORY_PANEL_WIDTH, this.height);

    const playerMoney = GameState.getInstance().player.money;

    INGREDIENT_DEFINITIONS.forEach((ing, index) => {
      const itemY = this.panelY + (INVENTORY_ITEM_HEIGHT + INVENTORY_ITEM_MARGIN) * index + INVENTORY_ITEM_MARGIN;

      // Background
      ctx.fillStyle = '#555';
      ctx.fillRect(this.panelX + INVENTORY_ITEM_MARGIN, itemY, INVENTORY_PANEL_WIDTH - 2 * INVENTORY_ITEM_MARGIN, INVENTORY_ITEM_HEIGHT);

      // Icon (Circle)
      const colors: Record<string, string> = {
        'tomato_sauce': '#e74c3c',
        'cheese': '#f1c40f',
        'pepperoni': '#c0392b',
        'dough': '#f5deb3'
      };
      ctx.fillStyle = colors[ing.id] || '#fff';
      ctx.beginPath();
      ctx.arc(this.panelX + INVENTORY_ITEM_MARGIN + 20, itemY + 20, 10, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ing.name, this.panelX + INVENTORY_ITEM_MARGIN + 40, itemY + 20);

      // Current Stock
      const currentStock = restaurant.inventory.get(ing.id) || 0;
      ctx.textAlign = 'right';
      ctx.fillText(`Stan: ${currentStock}`, this.panelX + INVENTORY_PANEL_WIDTH - 20, itemY + 20);

      // Buy Button
      const buyAmount = 5;
      const buyCost = ing.baseCost * buyAmount;
      const canAfford = playerMoney >= buyCost;

      const btnX = this.panelX + INVENTORY_ITEM_MARGIN + 10;
      const btnY = itemY + 35;
      const btnW = INVENTORY_PANEL_WIDTH - 2 * INVENTORY_ITEM_MARGIN - 20;
      const btnH = 25;

      ctx.fillStyle = canAfford ? '#27ae60' : '#7f8c8d';
      ctx.fillRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '12px Arial';
      ctx.fillText(`Kup ${buyAmount} szt. ($${buyCost.toFixed(2)})`, btnX + btnW / 2, btnY + btnH / 2);
    });
  }

  public handleClick(x: number, y: number, restaurant: Restaurant): void {
    if (x < this.panelX) return;

    INGREDIENT_DEFINITIONS.forEach((ing, index) => {
      const itemY = this.panelY + (INVENTORY_ITEM_HEIGHT + INVENTORY_ITEM_MARGIN) * index + INVENTORY_ITEM_MARGIN;

      const btnX = this.panelX + INVENTORY_ITEM_MARGIN + 10;
      const btnY = itemY + 35;
      const btnW = INVENTORY_PANEL_WIDTH - 2 * INVENTORY_ITEM_MARGIN - 20;
      const btnH = 25;

      if (x >= btnX && x <= btnX + btnW &&
        y >= btnY && y <= btnY + btnH) {

        const buyAmount = 5;
        const totalCost = ing.baseCost * buyAmount;

        // Attempt purchase
        if (restaurant.buyIngredient(ing.id, buyAmount, totalCost)) {
          console.log(`Bought ${buyAmount} ${ing.name}`);
        } else {
          console.log("Not enough money for ingredients");
        }
      }
    });
  }
}
