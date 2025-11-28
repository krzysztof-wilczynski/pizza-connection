import { Pizza } from '../model/Pizza';
import { Ingredient as ModelIngredient } from '../model/Ingredient';
import { IngredientType } from '../model/enums';
import { v4 as uuidv4 } from 'uuid';
import { AssetManager } from '../systems/AssetManager';
import { AssetKey, ASSETS_MANIFEST } from '../systems/AssetsManifest';

// --- Interfaces ---
export interface UIIngredient {
  name: string;
  cost: number;
  priceModifier: number;
  assetKey: AssetKey;
  type: IngredientType;
}

export interface PlacedIngredient {
  ingredient: UIIngredient;
  x: number;
  y: number;
  radius: number;
}

// --- Helper Functions ---
function isInside(pos: { x: number, y: number }, rect: { x: number, y: number, width: number, height: number }): boolean {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;
}

function distance(p1: {x: number, y: number}, p2: {x: number, y: number}): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// --- UI Constants ---
const UIConstants = {
  MODAL_WIDTH: 800,
  MODAL_HEIGHT: 600,
  PADDING: 20,
  LEFT_PANEL_WIDTH: 400,

  PIZZA_RADIUS: 150,
  PLACED_INGREDIENT_RADIUS: 25, // Slightly larger for images

  INGREDIENT_ITEM_HEIGHT: 50,
  INGREDIENT_ITEM_SPACING: 5,

  INPUT_HEIGHT: 40,
  BUTTON_HEIGHT: 50,

  CLOSE_BUTTON_SIZE: 30,
  CLOSE_BUTTON_MARGIN: 10,

  FONT_SIZE_MD: '16px',
  FONT_SIZE_LG: '20px',
  FONT_FAMILY: 'Arial',

  COLOR_BACKGROUND_OVERLAY: 'rgba(0, 0, 0, 0.7)',
  COLOR_MODAL_BG: '#2c3e50',
  COLOR_MODAL_BORDER: '#34495e',
  COLOR_PANEL_BG: '#34495e',
  COLOR_PANEL_ITEM_BG: '#2c3e50',
  COLOR_PANEL_ITEM_ACTIVE: '#3498db',
  COLOR_TEXT: '#ecf0f1',
  COLOR_INPUT_BG_ACTIVE: '#506880',
  COLOR_BUTTON_SAVE: '#27ae60',
  COLOR_BUTTON_CLOSE: '#c0392b',
};

export class PizzaCreator {
  public active: boolean = false;
  private assetManager: AssetManager;

  // Callback for saving the pizza
  public onSave: ((pizza: Pizza) => void) | null = null;

  // --- UI Layout ---
  private modalRect = { x: 0, y: 0, width: 0, height: 0 };
  private pizzaArea = { x: 0, y: 0, radius: 0 };
  private ingredientsPanel = { x: 0, y: 0, width: 0, height: 0 };
  private nameInputRect = { x: 0, y: 0, width: 0, height: 0 };
  private priceDisplayRect = { x: 0, y: 0, width: 0, height: 0 };
  private saveButtonRect = { x: 0, y: 0, width: 0, height: 0 };
  private closeButtonRect = { x: 0, y: 0, width: 0, height: 0 };

  // --- State ---
  private activeTool: UIIngredient | null = null; // Currently selected ingredient for stamping
  private mousePos = { x: 0, y: 0 }; // Relative to canvas
  private isNamingPizza: boolean = false;
  private cursorBlink: number = 0;

  public availableIngredients: UIIngredient[] = [
    { name: 'Sos', cost: 1, priceModifier: 1.1, assetKey: 'ingredients_sauce', type: IngredientType.Sauce },
    { name: 'Ser', cost: 2, priceModifier: 1.2, assetKey: 'ingredients_cheese', type: IngredientType.Cheese },
    { name: 'Salami', cost: 3, priceModifier: 1.5, assetKey: 'ingredients_salami', type: IngredientType.Topping },
    { name: 'Szynka', cost: 3, priceModifier: 1.4, assetKey: 'ingredients_ham', type: IngredientType.Topping },
    { name: 'Pieczarki', cost: 2, priceModifier: 1.3, assetKey: 'ingredients_mushroom', type: IngredientType.Topping },
    { name: 'Papryka', cost: 2, priceModifier: 1.2, assetKey: 'ingredients_pepper', type: IngredientType.Topping },
    { name: 'Oliwki', cost: 2, priceModifier: 1.3, assetKey: 'ingredients_olive', type: IngredientType.Topping },
  ];

  private selectedIngredients: PlacedIngredient[] = [];
  private pizzaName: string = 'Moja Pizza';

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public open(): void {
    this.active = true;
    this.selectedIngredients = [];
    this.pizzaName = 'Nowa Pizza';
    this.isNamingPizza = false;
    this.activeTool = null;
  }

  public close(): void {
    this.active = false;
    this.isNamingPizza = false;
    this.activeTool = null;
  }

  private calculatePrice(): { baseCost: number, sellPrice: number } {
    const baseCost = this.selectedIngredients.reduce((sum, item) => sum + item.ingredient.cost, 0);
    // Base dough cost
    const doughCost = 2.0;

    // Avg modifier
    const avgPriceModifier = this.selectedIngredients.length > 0
      ? this.selectedIngredients.reduce((sum, item) => sum + item.ingredient.priceModifier, 0) / this.selectedIngredients.length
      : 1.0;

    const totalCost = baseCost + doughCost;
    // Simple logic: Cost * Modifier + Margin
    const sellPrice = totalCost * avgPriceModifier * 1.5;
    return { baseCost: totalCost, sellPrice };
  }

  public saveToMenu(): Pizza {
    const { sellPrice } = this.calculatePrice();

    const ingredientsList = this.selectedIngredients.map(item => {
        return new ModelIngredient(
            uuidv4(),
            item.ingredient.name,
            item.ingredient.cost,
            item.ingredient.type
        );
    });

    return new Pizza(this.pizzaName, ingredientsList, parseFloat(sellPrice.toFixed(2)));
  }

  private updateLayout(canvasWidth: number, canvasHeight: number): void {
      this.modalRect = {
          width: UIConstants.MODAL_WIDTH,
          height: UIConstants.MODAL_HEIGHT,
          x: (canvasWidth - UIConstants.MODAL_WIDTH) / 2,
          y: (canvasHeight - UIConstants.MODAL_HEIGHT) / 2
      };

      const rightPanelX = this.modalRect.x + UIConstants.LEFT_PANEL_WIDTH + UIConstants.PADDING;
      const rightPanelWidth = this.modalRect.width - UIConstants.LEFT_PANEL_WIDTH - UIConstants.PADDING * 2;
      const rightPanelY = this.modalRect.y + UIConstants.PADDING;

      this.pizzaArea = {
          x: this.modalRect.x + UIConstants.LEFT_PANEL_WIDTH / 2,
          y: this.modalRect.y + this.modalRect.height / 2,
          radius: UIConstants.PIZZA_RADIUS
      };

      this.ingredientsPanel = {
          x: rightPanelX,
          y: rightPanelY,
          width: rightPanelWidth,
          height: this.availableIngredients.length * (UIConstants.INGREDIENT_ITEM_HEIGHT + UIConstants.INGREDIENT_ITEM_SPACING)
      };

      this.nameInputRect = {
          x: rightPanelX,
          y: this.ingredientsPanel.y + this.ingredientsPanel.height + UIConstants.PADDING,
          width: rightPanelWidth,
          height: UIConstants.INPUT_HEIGHT
      };

      this.priceDisplayRect = {
          x: rightPanelX,
          y: this.nameInputRect.y + this.nameInputRect.height + UIConstants.PADDING,
          width: rightPanelWidth,
          height: UIConstants.INPUT_HEIGHT
      };

      this.saveButtonRect = {
          x: rightPanelX,
          y: this.priceDisplayRect.y + this.priceDisplayRect.height + UIConstants.PADDING,
          width: rightPanelWidth,
          height: UIConstants.BUTTON_HEIGHT
      };

      this.closeButtonRect = {
          x: this.modalRect.x + this.modalRect.width - UIConstants.CLOSE_BUTTON_SIZE - UIConstants.CLOSE_BUTTON_MARGIN,
          y: this.modalRect.y + UIConstants.CLOSE_BUTTON_MARGIN,
          width: UIConstants.CLOSE_BUTTON_SIZE,
          height: UIConstants.CLOSE_BUTTON_SIZE
      };
  }

  // --- Event Handlers ---

  public handleMouseDown(event: MouseEvent): void {
    if (!this.active) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    // --- Interaction Logic ---

    // 1. Check for Ingredients Panel Click (Selection) - Left Click only
    if (event.button === 0) {
        this.availableIngredients.forEach((ingredient, index) => {
            const itemRect = {
                x: this.ingredientsPanel.x,
                y: this.ingredientsPanel.y + index * (UIConstants.INGREDIENT_ITEM_HEIGHT + UIConstants.INGREDIENT_ITEM_SPACING),
                width: this.ingredientsPanel.width,
                height: UIConstants.INGREDIENT_ITEM_HEIGHT
            };
            if (isInside(this.mousePos, itemRect)) {
                // Toggle if clicking same
                if (this.activeTool === ingredient) {
                    this.activeTool = null;
                } else {
                    this.activeTool = ingredient;
                }
            }
        });

        // Name Input
        this.isNamingPizza = isInside(this.mousePos, this.nameInputRect);
    }

    // 2. Pizza Area Interaction (Stamp / Remove)
    if (distance(this.mousePos, this.pizzaArea) < this.pizzaArea.radius) {
        if (event.button === 0) {
            // Left Click: Stamp
            if (this.activeTool) {
                this.selectedIngredients.push({
                    ingredient: this.activeTool,
                    x: this.mousePos.x,
                    y: this.mousePos.y,
                    radius: UIConstants.PLACED_INGREDIENT_RADIUS
                });
            }
        } else if (event.button === 2) {
            // Right Click: Remove
            // Find top-most ingredient at click position
            // Reverse iterate to find the one drawn last (on top)
            for (let i = this.selectedIngredients.length - 1; i >= 0; i--) {
                const placed = this.selectedIngredients[i];
                if (distance(this.mousePos, placed) < placed.radius) {
                    this.selectedIngredients.splice(i, 1);
                    break; // Remove only one at a time
                }
            }
        }
    }
  }

  public handleMouseMove(event: MouseEvent): void {
    if (!this.active) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  public handleMouseUp(event: MouseEvent): void {
      // Not needed for stamping, but good to have
  }

  public handleMouseClick(event: MouseEvent): void {
    if (!this.active) return;
    // Calculate modal-relative hitboxes by ensuring updateLayout runs or using current logic
    // We can just rely on the rects calculated in updateLayout/render

    // Fix: Close button and Save button interaction
    // Note: handleMouseClick usually fires on Left Click release.

    if (isInside(this.mousePos, this.closeButtonRect)) {
        this.close();
        return;
    }

    if (isInside(this.mousePos, this.saveButtonRect)) {
        const newPizza = this.saveToMenu();
        if (this.onSave) {
            this.onSave(newPizza);
        }
        this.close();
        return;
    }

    // Close if clicked outside
    if (!isInside(this.mousePos, this.modalRect)) {
       // this.close(); // Optional: Close on backdrop click
    }
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (!this.active || !this.isNamingPizza) return;

    if (event.key === 'Backspace') {
      this.pizzaName = this.pizzaName.slice(0, -1);
    } else if (event.key === 'Enter') {
      this.isNamingPizza = false;
    } else if (event.key.length === 1 && this.pizzaName.length < 20) {
      this.pizzaName += event.key;
    }
  }

  // --- Render Functions ---
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    this.cursorBlink = (this.cursorBlink + 1) % 60;
    this.updateLayout(ctx.canvas.width, ctx.canvas.height);

    // Overlay
    ctx.fillStyle = UIConstants.COLOR_BACKGROUND_OVERLAY;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Modal Background
    ctx.fillStyle = UIConstants.COLOR_MODAL_BG;
    ctx.strokeStyle = UIConstants.COLOR_MODAL_BORDER;
    ctx.lineWidth = 2;
    ctx.fillRect(this.modalRect.x, this.modalRect.y, this.modalRect.width, this.modalRect.height);
    ctx.strokeRect(this.modalRect.x, this.modalRect.y, this.modalRect.width, this.modalRect.height);

    // --- Pizza Area ---
    // Draw Dough
    const doughImg = this.assetManager.getAsset('ingredients_dough');
    if (doughImg) {
        ctx.drawImage(
            doughImg,
            this.pizzaArea.x - this.pizzaArea.radius,
            this.pizzaArea.y - this.pizzaArea.radius,
            this.pizzaArea.radius * 2,
            this.pizzaArea.radius * 2
        );
    } else {
        // Fallback
        ctx.fillStyle = '#d2b48c';
        ctx.beginPath();
        ctx.arc(this.pizzaArea.x, this.pizzaArea.y, this.pizzaArea.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Placed Ingredients
    this.selectedIngredients.forEach(placed => {
        const img = this.assetManager.getAsset(placed.ingredient.assetKey);
        if (img) {
            ctx.drawImage(
                img,
                placed.x - placed.radius,
                placed.y - placed.radius,
                placed.radius * 2,
                placed.radius * 2
            );
        } else {
             // Fallback
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(placed.x, placed.y, placed.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw Ghost (Active Tool)
    if (this.activeTool && distance(this.mousePos, this.pizzaArea) < this.pizzaArea.radius) {
        const img = this.assetManager.getAsset(this.activeTool.assetKey);
        ctx.globalAlpha = 0.5;
        if (img) {
             ctx.drawImage(
                img,
                this.mousePos.x - UIConstants.PLACED_INGREDIENT_RADIUS,
                this.mousePos.y - UIConstants.PLACED_INGREDIENT_RADIUS,
                UIConstants.PLACED_INGREDIENT_RADIUS * 2,
                UIConstants.PLACED_INGREDIENT_RADIUS * 2
            );
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.mousePos.x, this.mousePos.y, UIConstants.PLACED_INGREDIENT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    // --- UI Panels ---
    this.renderRightPanel(ctx);

    // Close Button
    ctx.fillStyle = UIConstants.COLOR_BUTTON_CLOSE;
    ctx.fillRect(this.closeButtonRect.x, this.closeButtonRect.y, this.closeButtonRect.width, this.closeButtonRect.height);
    ctx.strokeStyle = UIConstants.COLOR_TEXT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const xMargin = this.closeButtonRect.width * 0.25;
    const yMargin = this.closeButtonRect.height * 0.25;
    ctx.moveTo(this.closeButtonRect.x + xMargin, this.closeButtonRect.y + yMargin);
    ctx.lineTo(this.closeButtonRect.x + this.closeButtonRect.width - xMargin, this.closeButtonRect.y + this.closeButtonRect.height - yMargin);
    ctx.moveTo(this.closeButtonRect.x + this.closeButtonRect.width - xMargin, this.closeButtonRect.y + yMargin);
    ctx.lineTo(this.closeButtonRect.x + xMargin, this.closeButtonRect.y + this.closeButtonRect.height - yMargin);
    ctx.stroke();
  }

  private renderRightPanel(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${UIConstants.FONT_SIZE_MD} ${UIConstants.FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Ingredients List
    this.availableIngredients.forEach((ingredient, index) => {
        const itemY = this.ingredientsPanel.y + index * (UIConstants.INGREDIENT_ITEM_HEIGHT + UIConstants.INGREDIENT_ITEM_SPACING);

        // Highlight active tool
        ctx.fillStyle = (this.activeTool === ingredient) ? UIConstants.COLOR_PANEL_ITEM_ACTIVE : UIConstants.COLOR_PANEL_ITEM_BG;
        ctx.fillRect(this.ingredientsPanel.x, itemY, this.ingredientsPanel.width, UIConstants.INGREDIENT_ITEM_HEIGHT);

        // Icon
        const img = this.assetManager.getAsset(ingredient.assetKey);
        if (img) {
            // Draw scaled icon
            const iconSize = 30;
            ctx.drawImage(
                img,
                this.ingredientsPanel.x + 10,
                itemY + (UIConstants.INGREDIENT_ITEM_HEIGHT - iconSize)/2,
                iconSize,
                iconSize
            );
        } else {
             ctx.fillStyle = '#ccc';
             ctx.beginPath();
             ctx.arc(this.ingredientsPanel.x + 25, itemY + UIConstants.INGREDIENT_ITEM_HEIGHT / 2, 10, 0, Math.PI * 2);
             ctx.fill();
        }

        ctx.fillStyle = UIConstants.COLOR_TEXT;
        ctx.fillText(ingredient.name, this.ingredientsPanel.x + 55, itemY + UIConstants.INGREDIENT_ITEM_HEIGHT / 2);

        // Cost
        ctx.textAlign = 'right';
        ctx.fillText(`${ingredient.cost} zł`, this.ingredientsPanel.x + this.ingredientsPanel.width - 10, itemY + UIConstants.INGREDIENT_ITEM_HEIGHT / 2);
        ctx.textAlign = 'left';
    });

    // Name Input
    ctx.fillStyle = this.isNamingPizza ? UIConstants.COLOR_INPUT_BG_ACTIVE : UIConstants.COLOR_PANEL_BG;
    ctx.fillRect(this.nameInputRect.x, this.nameInputRect.y, this.nameInputRect.width, this.nameInputRect.height);
    ctx.fillStyle = UIConstants.COLOR_TEXT;
    let nameText = 'Nazwa: ' + this.pizzaName;
    if (this.isNamingPizza && this.cursorBlink < 30) {
      nameText += '|';
    }
    ctx.fillText(nameText, this.nameInputRect.x + 10, this.nameInputRect.y + this.nameInputRect.height / 2);

    // Price Display
    const { baseCost, sellPrice } = this.calculatePrice();
    ctx.fillStyle = UIConstants.COLOR_PANEL_BG;
    ctx.fillRect(this.priceDisplayRect.x, this.priceDisplayRect.y, this.priceDisplayRect.width, this.priceDisplayRect.height);
    ctx.fillStyle = UIConstants.COLOR_TEXT;

    // Draw two lines of text
    ctx.fillText(`Koszt: ${baseCost.toFixed(2)} zł`, this.priceDisplayRect.x + 10, this.priceDisplayRect.y + this.priceDisplayRect.height / 2);
    ctx.textAlign = 'right';
    ctx.fillText(`Cena: ${sellPrice.toFixed(2)} zł`, this.priceDisplayRect.x + this.priceDisplayRect.width - 10, this.priceDisplayRect.y + this.priceDisplayRect.height / 2);
    ctx.textAlign = 'left';

    // Save Button
    ctx.fillStyle = UIConstants.COLOR_BUTTON_SAVE;
    ctx.fillRect(this.saveButtonRect.x, this.saveButtonRect.y, this.saveButtonRect.width, this.saveButtonRect.height);
    ctx.fillStyle = UIConstants.COLOR_TEXT;
    ctx.font = `${UIConstants.FONT_SIZE_LG} ${UIConstants.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('Zapisz do Menu', this.saveButtonRect.x + this.saveButtonRect.width / 2, this.saveButtonRect.y + this.saveButtonRect.height / 2);

    ctx.textAlign = 'left';
  }
}
