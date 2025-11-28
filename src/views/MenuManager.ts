import { Restaurant } from '../model/Restaurant';

// --- UI Constants ---
const UIConstants = {
  MODAL_WIDTH: 700,
  MODAL_HEIGHT: 500,
  PADDING: 20,
  HEADER_HEIGHT: 50,
  ITEM_HEIGHT: 80,
  ITEM_SPACING: 10,

  BUTTON_SIZE: 30,
  BUTTON_MARGIN: 10,

  FONT_FAMILY: 'Arial',
  COLOR_OVERLAY: 'rgba(0, 0, 0, 0.7)',
  COLOR_BG: '#ecf0f1',
  COLOR_ITEM_BG: '#ffffff',
  COLOR_TEXT: '#2c3e50',
  COLOR_DELETE: '#c0392b',
  COLOR_EDIT: '#2980b9',
  COLOR_CLOSE: '#e74c3c'
};

export class MenuManager {
  public active: boolean = false;
  private restaurant: Restaurant;

  private modalRect = { x: 0, y: 0, width: 0, height: 0 };
  private closeBtnRect = { x: 0, y: 0, width: 0, height: 0 };
  private scrollOffset: number = 0;

  constructor(restaurant: Restaurant) {
    this.restaurant = restaurant;
  }

  public open(): void {
    this.active = true;
    this.scrollOffset = 0;
  }

  public close(): void {
    this.active = false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Update Layout
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;

    this.modalRect = {
      x: (canvasW - UIConstants.MODAL_WIDTH) / 2,
      y: (canvasH - UIConstants.MODAL_HEIGHT) / 2,
      width: UIConstants.MODAL_WIDTH,
      height: UIConstants.MODAL_HEIGHT
    };

    this.closeBtnRect = {
        x: this.modalRect.x + this.modalRect.width - UIConstants.BUTTON_SIZE - UIConstants.PADDING,
        y: this.modalRect.y + UIConstants.PADDING,
        width: UIConstants.BUTTON_SIZE,
        height: UIConstants.BUTTON_SIZE
    };

    // Draw Overlay
    ctx.fillStyle = UIConstants.COLOR_OVERLAY;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw Modal Background
    ctx.fillStyle = UIConstants.COLOR_BG;
    ctx.fillRect(this.modalRect.x, this.modalRect.y, this.modalRect.width, this.modalRect.height);

    // Header
    ctx.fillStyle = UIConstants.COLOR_TEXT;
    ctx.font = `bold 24px ${UIConstants.FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText("Karta Dań (Menu)", this.modalRect.x + UIConstants.PADDING, this.modalRect.y + 30);

    // Close Button
    ctx.fillStyle = UIConstants.COLOR_CLOSE;
    ctx.fillRect(this.closeBtnRect.x, this.closeBtnRect.y, this.closeBtnRect.width, this.closeBtnRect.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("X", this.closeBtnRect.x + this.closeBtnRect.width/2, this.closeBtnRect.y + this.closeBtnRect.height/2);

    // List Content
    const listY = this.modalRect.y + UIConstants.HEADER_HEIGHT + UIConstants.PADDING;
    const listH = this.modalRect.height - UIConstants.HEADER_HEIGHT - UIConstants.PADDING * 2;

    // Clip area for scrolling
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.modalRect.x, listY, this.modalRect.width, listH);
    ctx.clip();

    const menu = this.restaurant.menu;

    if (menu.length === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = 'italic 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Menu jest puste. Stwórz pizzę w kreatorze!", this.modalRect.x + this.modalRect.width/2, listY + 50);
    } else {
        menu.forEach((pizza, index) => {
            const itemY = listY + index * (UIConstants.ITEM_HEIGHT + UIConstants.ITEM_SPACING) - this.scrollOffset;

            // Render visible items only
            if (itemY + UIConstants.ITEM_HEIGHT < listY || itemY > listY + listH) return;

            const itemX = this.modalRect.x + UIConstants.PADDING;
            const itemW = this.modalRect.width - UIConstants.PADDING * 2;

            // Item Background
            ctx.fillStyle = UIConstants.COLOR_ITEM_BG;
            ctx.fillRect(itemX, itemY, itemW, UIConstants.ITEM_HEIGHT);

            // Pizza Name
            ctx.fillStyle = UIConstants.COLOR_TEXT;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(pizza.name, itemX + 10, itemY + 25);

            // Ingredients (small text)
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '14px Arial';
            const ingText = pizza.ingredients.map(i => i.name).join(', ');
            ctx.fillText(ingText, itemX + 10, itemY + 50);

            // Price Controls
            const priceX = itemX + itemW - 180;
            const btnSize = 25;

            // Minus
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(priceX, itemY + 20, btnSize, btnSize);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText("-", priceX + btnSize/2, itemY + 20 + btnSize/2);

            // Price
            ctx.fillStyle = UIConstants.COLOR_TEXT;
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`${pizza.salePrice.toFixed(2)} zł`, priceX + 45 + btnSize, itemY + 20 + btnSize/2);

            // Plus
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(priceX + 100, itemY + 20, btnSize, btnSize);
            ctx.fillStyle = 'black';
            ctx.fillText("+", priceX + 100 + btnSize/2, itemY + 20 + btnSize/2);

            // Delete Button
            const delBtnX = itemX + itemW - 40;
            ctx.fillStyle = UIConstants.COLOR_DELETE;
            ctx.fillRect(delBtnX, itemY + 20, 30, 30);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.fillText("X", delBtnX + 15, itemY + 35);
        });
    }

    ctx.restore();
  }

  public handleMouseClick(event: MouseEvent): void {
    if (!this.active) return;

    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check Close
    if (mouseX >= this.closeBtnRect.x && mouseX <= this.closeBtnRect.x + this.closeBtnRect.width &&
        mouseY >= this.closeBtnRect.y && mouseY <= this.closeBtnRect.y + this.closeBtnRect.height) {
        this.close();
        return;
    }

    // Check Items
    const listY = this.modalRect.y + UIConstants.HEADER_HEIGHT + UIConstants.PADDING;
    const menu = this.restaurant.menu;

    menu.forEach((pizza, index) => {
        const itemY = listY + index * (UIConstants.ITEM_HEIGHT + UIConstants.ITEM_SPACING) - this.scrollOffset;
        const itemX = this.modalRect.x + UIConstants.PADDING;
        const itemW = this.modalRect.width - UIConstants.PADDING * 2;

        if (mouseY >= itemY && mouseY <= itemY + UIConstants.ITEM_HEIGHT &&
            mouseX >= itemX && mouseX <= itemX + itemW) {

            // Controls Logic
            const priceX = itemX + itemW - 180;
            const btnSize = 25;

            // Minus
            if (mouseX >= priceX && mouseX <= priceX + btnSize &&
                mouseY >= itemY + 20 && mouseY <= itemY + 20 + btnSize) {
                const newPrice = Math.max(0, pizza.salePrice - 1.0);
                this.restaurant.updatePizzaPrice(pizza.id, parseFloat(newPrice.toFixed(2)));
                return;
            }

            // Plus
            if (mouseX >= priceX + 100 && mouseX <= priceX + 100 + btnSize &&
                mouseY >= itemY + 20 && mouseY <= itemY + 20 + btnSize) {
                const newPrice = pizza.salePrice + 1.0;
                this.restaurant.updatePizzaPrice(pizza.id, parseFloat(newPrice.toFixed(2)));
                return;
            }

            // Delete
            const delBtnX = itemX + itemW - 40;
            if (mouseX >= delBtnX && mouseX <= delBtnX + 30 &&
                mouseY >= itemY + 20 && mouseY <= itemY + 50) {
                this.restaurant.removePizza(pizza.id);
                return;
            }
        }
    });

    // Check outside to close?
    if (mouseX < this.modalRect.x || mouseX > this.modalRect.x + this.modalRect.width ||
        mouseY < this.modalRect.y || mouseY > this.modalRect.y + this.modalRect.height) {
        // Optional: Close on outside click
        // this.close();
    }
  }

  public handleWheel(event: WheelEvent): void {
      if (!this.active) return;
      this.scrollOffset += event.deltaY;
      this.scrollOffset = Math.max(0, this.scrollOffset);

      const listH = this.modalRect.height - UIConstants.HEADER_HEIGHT - UIConstants.PADDING * 2;
      const totalContentHeight = this.restaurant.menu.length * (UIConstants.ITEM_HEIGHT + UIConstants.ITEM_SPACING);
      const maxScroll = Math.max(0, totalContentHeight - listH);

      this.scrollOffset = Math.min(this.scrollOffset, maxScroll);
  }
}
