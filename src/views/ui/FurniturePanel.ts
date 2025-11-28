import { Furniture } from '../../model/Furniture';
import { AssetManager } from '../../systems/AssetManager';
import { GameState } from '../../model/GameState';
import { FURNITURE_CATALOG } from '../../data/FurnitureCatalog';

export class FurniturePanel {
  private assetManager: AssetManager;
  private onSelect: (furniture: Furniture) => void;

  private activeCategory: 'kitchen' | 'dining' | 'decoration' = 'kitchen';
  private categories: ('kitchen' | 'dining' | 'decoration')[] = ['kitchen', 'dining', 'decoration'];

  private scrollY: number = 0;
  private readonly TAB_HEIGHT = 40;
  private readonly ITEM_HEIGHT = 60;

  constructor(assetManager: AssetManager, onSelect: (furniture: Furniture) => void) {
    this.assetManager = assetManager;
    this.onSelect = onSelect;
  }

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    // Background
    ctx.fillStyle = 'rgba(40, 30, 20, 0.95)'; // Dark brown/wood background
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // --- TABS ---
    const tabWidth = width / 3;
    this.categories.forEach((cat, index) => {
        const tabX = x + index * tabWidth;
        const isActive = this.activeCategory === cat;

        // Tab Background
        ctx.fillStyle = isActive ? '#A0522D' : '#553322';
        ctx.fillRect(tabX, y, tabWidth, this.TAB_HEIGHT);

        // Tab Border
        ctx.strokeRect(tabX, y, tabWidth, this.TAB_HEIGHT);

        // Tab Label (Icon/Text)
        ctx.fillStyle = isActive ? '#FFFFFF' : '#AAAAAA';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Simple mapping for display
        let label = 'KITCHEN';
        if (cat === 'dining') label = 'DINING';
        if (cat === 'decoration') label = 'DECOR';

        ctx.fillText(label, tabX + tabWidth / 2, y + this.TAB_HEIGHT / 2);
    });

    // --- LIST CONTENT ---
    const contentY = y + this.TAB_HEIGHT;
    const contentHeight = height - this.TAB_HEIGHT;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, contentY, width, contentHeight);
    ctx.clip();

    const filteredItems = FURNITURE_CATALOG.filter(i => i.type === this.activeCategory);
    const playerMoney = GameState.getInstance().player.money;

    filteredItems.forEach((item, index) => {
        const itemY = contentY + index * this.ITEM_HEIGHT - this.scrollY;

        // Skip rendering if completely out of view
        if (itemY + this.ITEM_HEIGHT < contentY || itemY > y + height) return;

        // Item Background
        const isHovered = false; // TODO: Add hover state if needed
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x + 5, itemY + 5, width - 10, this.ITEM_HEIGHT - 10);

        // Icon
        const img = this.assetManager.getAsset(item.assetKey);
        if (img && img.naturalWidth > 0) {
            ctx.drawImage(img, x + 10, itemY + 10, 40, 40);
        } else {
             ctx.fillStyle = item.color || '#999';
             ctx.fillRect(x + 10, itemY + 10, 40, 40);
        }

        // Text Info
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(item.name, x + 60, itemY + 10);

        // Price
        const canAfford = playerMoney >= item.price;
        ctx.fillStyle = canAfford ? '#4CAF50' : '#FF5252'; // Green if affordable, Red if not
        ctx.font = '12px Arial';
        ctx.fillText(`$${item.price}`, x + 60, itemY + 30);
    });

    ctx.restore();
  }

  /**
   * Handles clicks on the panel.
   * @param localX X coordinate relative to the panel's left edge
   * @param localY Y coordinate relative to the panel's top edge
   * @param width Panel width
   * @returns Selected Furniture or null
   */
  public handleClick(localX: number, localY: number, width: number): Furniture | null {
      // 1. Check Tabs
      if (localY < this.TAB_HEIGHT) {
          const tabWidth = width / 3;
          const index = Math.floor(localX / tabWidth);
          if (index >= 0 && index < this.categories.length) {
              this.activeCategory = this.categories[index];
              this.scrollY = 0; // Reset scroll when switching tabs
          }
          return null; // Just switched tab, didn't select item
      }

      // 2. Check Items
      const listY = localY - this.TAB_HEIGHT + this.scrollY;
      // 5px padding on top of item
      const index = Math.floor((listY - 5) / this.ITEM_HEIGHT);

      const filteredItems = FURNITURE_CATALOG.filter(i => i.type === this.activeCategory);

      if (index >= 0 && index < filteredItems.length) {
          // Check if clicked strictly within item bounds (ignoring padding)?
          // For now, the whole row is clickable.
          return filteredItems[index];
      }

      return null;
  }
}
