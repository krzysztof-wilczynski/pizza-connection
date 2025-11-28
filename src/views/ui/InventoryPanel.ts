import { INGREDIENT_DEFINITIONS } from '../../data/ingredientDefinitions';
import { GameState } from '../../model/GameState';
import { Restaurant } from '../../model/Restaurant';

export class InventoryPanel {
  private scrollY: number = 0;
  private readonly ITEM_HEIGHT = 60;

  constructor() {}

  public handleWheel(deltaY: number): void {
      this.scrollY += deltaY;
      if (this.scrollY < 0) this.scrollY = 0;
      // Max scroll not rigidly enforced but could be if we calculate total height
  }

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, restaurant: Restaurant): void {
    // Background
    ctx.fillStyle = 'rgba(40, 30, 20, 0.95)';
    ctx.fillRect(x, y, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    const playerMoney = GameState.getInstance().player.money;
    let currentY = y - this.scrollY + 10;

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('INGREDIENTS', x + 10, currentY);
    currentY += 25;

    INGREDIENT_DEFINITIONS.forEach((ing) => {
        // Skip rendering if completely out of view
        if (currentY + this.ITEM_HEIGHT < y || currentY > y + height) {
            currentY += this.ITEM_HEIGHT + 5;
            return;
        }

        const colors: Record<string, string> = {
            'tomato_sauce': '#e74c3c',
            'cheese': '#f1c40f',
            'pepperoni': '#c0392b',
            'dough': '#f5deb3'
        };

        // Item Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x + 5, currentY, width - 10, this.ITEM_HEIGHT);

        // Icon
        ctx.fillStyle = colors[ing.id] || '#fff';
        ctx.beginPath();
        ctx.arc(x + 30, currentY + 30, 15, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(ing.name, x + 60, currentY + 20);

        const currentStock = restaurant.inventory.get(ing.id) || 0;
        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText(`Stock: ${currentStock}`, x + 60, currentY + 40);

        // Buy Button
        const buyAmount = 5;
        const buyCost = ing.baseCost * buyAmount;
        const canAfford = playerMoney >= buyCost;

        const btnX = x + width - 90;
        const btnY = currentY + 15;
        const btnW = 80;
        const btnH = 30;

        ctx.fillStyle = canAfford ? '#3498db' : '#555';
        ctx.fillRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Buy 5 ($${buyCost})`, btnX + btnW / 2, btnY + 19);

        currentY += this.ITEM_HEIGHT + 5;
    });

    ctx.restore();
  }

  public handleClick(localX: number, localY: number, width: number, restaurant: Restaurant): number {
      let currentY = 10 - this.scrollY;
      currentY += 25; // Header

      // Loop to find clicked item
      for (const ing of INGREDIENT_DEFINITIONS) {
          const buyAmount = 5;
          const buyCost = ing.baseCost * buyAmount;

          const btnX = width - 90;
          const btnY = currentY + 15;
          const btnW = 80;
          const btnH = 30;

          if (localY >= btnY && localY <= btnY + btnH && localX >= btnX && localX <= btnX + btnW) {
             const success = restaurant.buyIngredient(ing.id, buyAmount, buyCost);
             if (success) {
               return buyCost;
             }
             return 0;
          }
          currentY += this.ITEM_HEIGHT + 5;
      }
      return 0;
  }
}
