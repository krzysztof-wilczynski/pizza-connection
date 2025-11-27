import { Pizza } from './model/Pizza';
import { Ingredient as ModelIngredient } from './model/Ingredient';
import { IngredientType } from './model/enums';
import { v4 as uuidv4 } from 'uuid';

// --- Interfaces ---
// Rename local interface to avoid collision with ModelIngredient
export interface UIIngredient {
  name: string;
  cost: number;
  priceModifier: number;
  color: string;
  // We add this to help mapping, though strictly speaking the UIIngredient data
  // in availableIngredients doesn't have it yet. We'll handle it in the map logic.
  type?: IngredientType;
}

export interface PizzaRecipe {
  name:string;
  ingredients: string[];
  baseCost: number;
  sellPrice: number;
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
  PLACED_INGREDIENT_RADIUS: 15,

  INGREDIENT_ITEM_HEIGHT: 40,
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
  COLOR_PIZZA_BASE: '#d2b48c',
  COLOR_PANEL_BG: '#34495e',
  COLOR_TEXT: '#ecf0f1',
  COLOR_INPUT_BG_ACTIVE: '#506880',
  COLOR_BUTTON_SAVE: '#27ae60',
  COLOR_BUTTON_CLOSE: '#c0392b',
};

export class PizzaCreator {
  public active: boolean = false;

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
  private isDragging: boolean = false;
  private draggedIngredient: UIIngredient | null = null;
  private draggedPlacedIngredient: PlacedIngredient | null = null;
  private dragOffset = { x: 0, y: 0 };
  private mousePos = { x: 0, y: 0 };
  private isNamingPizza: boolean = false;
  private cursorBlink: number = 0;


  public availableIngredients: UIIngredient[] = [
    { name: 'Ser', cost: 2, priceModifier: 1.2, color: '#FFD700', type: IngredientType.Cheese },
    { name: 'Sos', cost: 1, priceModifier: 1.1, color: '#FF4500', type: IngredientType.Sauce },
    { name: 'Salami', cost: 3, priceModifier: 1.5, color: '#DC143C', type: IngredientType.Topping },
    { name: 'Pieczarki', cost: 2, priceModifier: 1.3, color: '#A0522D', type: IngredientType.Topping },
    { name: 'Papryka', cost: 2, priceModifier: 1.2, color: '#228B22', type: IngredientType.Topping },
  ];

  private selectedIngredients: PlacedIngredient[] = [];
  private pizzaName: string = 'Moja Pizza';

  constructor() {}

  public open(): void {
    this.active = true;
    this.selectedIngredients = [];
    this.pizzaName = 'Nowa Pizza';
    this.isNamingPizza = false;
  }

  public close(): void {
    this.active = false;
    this.isNamingPizza = false;
  }

  private calculatePrice(): { baseCost: number, sellPrice: number } {
    const baseCost = this.selectedIngredients.reduce((sum, item) => sum + item.ingredient.cost, 0);
    const avgPriceModifier = this.selectedIngredients.length > 0
      ? this.selectedIngredients.reduce((sum, item) => sum + item.ingredient.priceModifier, 0) / this.selectedIngredients.length
      : 1;
    const sellPrice = baseCost * avgPriceModifier;
    return { baseCost, sellPrice };
  }

  public saveToMenu(): Pizza {
    const { baseCost, sellPrice } = this.calculatePrice();

    const ingredientsList = this.selectedIngredients.map(item => {
        // Create a new ModelIngredient instance for each placed ingredient.
        // We use uuid for unique ID.
        // We default to Topping if type is missing, but availableIngredients has types now.
        return new ModelIngredient(
            uuidv4(),
            item.ingredient.name,
            item.ingredient.cost,
            item.ingredient.type ?? IngredientType.Topping
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

    this.isNamingPizza = isInside(this.mousePos, this.nameInputRect);

    if (!this.isNamingPizza) {
      this.availableIngredients.forEach((ingredient, index) => {
          const itemRect = {
              x: this.ingredientsPanel.x,
              y: this.ingredientsPanel.y + index * (UIConstants.INGREDIENT_ITEM_HEIGHT + UIConstants.INGREDIENT_ITEM_SPACING),
              width: this.ingredientsPanel.width,
              height: UIConstants.INGREDIENT_ITEM_HEIGHT
          };
          if (isInside(this.mousePos, itemRect)) {
              this.isDragging = true;
              this.draggedIngredient = ingredient;
              this.dragOffset = { x: 0, y: 0 };
          }
      });

      this.selectedIngredients.forEach(placed => {
        if(distance(this.mousePos, placed) < placed.radius) {
          this.isDragging = true;
          this.draggedPlacedIngredient = placed;
          this.dragOffset = { x: this.mousePos.x - placed.x, y: this.mousePos.y - placed.y };
          this.selectedIngredients = this.selectedIngredients.filter(p => p !== placed);
          this.selectedIngredients.push(placed);
        }
      });
    }
  }

  public handleMouseMove(event: MouseEvent): void {
    if (!this.active || !this.isDragging) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if(this.draggedPlacedIngredient) {
      this.draggedPlacedIngredient.x = this.mousePos.x - this.dragOffset.x;
      this.draggedPlacedIngredient.y = this.mousePos.y - this.dragOffset.y;
    }
  }

  public handleMouseUp(event: MouseEvent): void {
    if (!this.active || !this.isDragging) return;
    this.isDragging = false;

    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    const isOverPizza = distance(this.mousePos, this.pizzaArea) < this.pizzaArea.radius;

    if (this.draggedIngredient && isOverPizza) {
        this.selectedIngredients.push({
          ingredient: this.draggedIngredient,
          x: this.mousePos.x,
          y: this.mousePos.y,
          radius: UIConstants.PLACED_INGREDIENT_RADIUS
        });
    }

    if(this.draggedPlacedIngredient && !isOverPizza) {
      this.selectedIngredients = this.selectedIngredients.filter(p => p !== this.draggedPlacedIngredient);
    }

    this.draggedIngredient = null;
    this.draggedPlacedIngredient = null;
  }

  public handleMouseClick(event: MouseEvent): void {
    if (!this.active) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

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

    if (!isInside(this.mousePos, this.modalRect)) {
        this.close();
    }
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (!this.active || !this.isNamingPizza) return;

    if (event.key === 'Backspace') {
      this.pizzaName = this.pizzaName.slice(0, -1);
    } else if (event.key === 'Enter') {
      this.isNamingPizza = false;
    } else if (event.key.length === 1 && this.pizzaName.length < 20) { // Limit name length
      this.pizzaName += event.key;
    }
  }

  // --- Render Functions ---
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    this.cursorBlink = (this.cursorBlink + 1) % 60; // Simple blink animation
    this.updateLayout(ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = UIConstants.COLOR_BACKGROUND_OVERLAY;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = UIConstants.COLOR_MODAL_BG;
    ctx.strokeStyle = UIConstants.COLOR_MODAL_BORDER;
    ctx.lineWidth = 2;
    ctx.fillRect(this.modalRect.x, this.modalRect.y, this.modalRect.width, this.modalRect.height);
    ctx.strokeRect(this.modalRect.x, this.modalRect.y, this.modalRect.width, this.modalRect.height);

    ctx.fillStyle = UIConstants.COLOR_PIZZA_BASE;
    ctx.beginPath();
    ctx.arc(this.pizzaArea.x, this.pizzaArea.y, this.pizzaArea.radius, 0, Math.PI * 2);
    ctx.fill();

    this.selectedIngredients.forEach(placed => {
      ctx.fillStyle = placed.ingredient.color;
      ctx.beginPath();
      ctx.arc(placed.x, placed.y, placed.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    this.renderRightPanel(ctx);

    if (this.isDragging && this.draggedIngredient) {
        ctx.fillStyle = this.draggedIngredient.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.mousePos.x, this.mousePos.y, UIConstants.PLACED_INGREDIENT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
  }

  private renderRightPanel(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${UIConstants.FONT_SIZE_MD} ${UIConstants.FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    this.availableIngredients.forEach((ingredient, index) => {
        const itemY = this.ingredientsPanel.y + index * (UIConstants.INGREDIENT_ITEM_HEIGHT + UIConstants.INGREDIENT_ITEM_SPACING);
        ctx.fillStyle = UIConstants.COLOR_PANEL_BG;
        ctx.fillRect(this.ingredientsPanel.x, itemY, this.ingredientsPanel.width, UIConstants.INGREDIENT_ITEM_HEIGHT);

        ctx.fillStyle = ingredient.color;
        ctx.beginPath();
        ctx.arc(this.ingredientsPanel.x + 20, itemY + UIConstants.INGREDIENT_ITEM_HEIGHT / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = UIConstants.COLOR_TEXT;
        ctx.fillText(ingredient.name, this.ingredientsPanel.x + 45, itemY + UIConstants.INGREDIENT_ITEM_HEIGHT / 2);
    });

    ctx.fillStyle = this.isNamingPizza ? UIConstants.COLOR_INPUT_BG_ACTIVE : UIConstants.COLOR_PANEL_BG;
    ctx.fillRect(this.nameInputRect.x, this.nameInputRect.y, this.nameInputRect.width, this.nameInputRect.height);
    ctx.fillStyle = UIConstants.COLOR_TEXT;
    let nameText = 'Nazwa: ' + this.pizzaName;
    if (this.isNamingPizza && this.cursorBlink < 30) {
      nameText += '|';
    }
    ctx.fillText(nameText, this.nameInputRect.x + 10, this.nameInputRect.y + this.nameInputRect.height / 2);

    const { sellPrice } = this.calculatePrice();
    ctx.fillStyle = UIConstants.COLOR_PANEL_BG;
    ctx.fillRect(this.priceDisplayRect.x, this.priceDisplayRect.y, this.priceDisplayRect.width, this.priceDisplayRect.height);
    ctx.fillStyle = UIConstants.COLOR_TEXT;
    ctx.fillText(`Cena: ${sellPrice.toFixed(2)} zł`, this.priceDisplayRect.x + 10, this.priceDisplayRect.y + this.priceDisplayRect.height / 2);

    ctx.fillStyle = UIConstants.COLOR_BUTTON_SAVE;
    ctx.fillRect(this.saveButtonRect.x, this.saveButtonRect.y, this.saveButtonRect.width, this.saveButtonRect.height);
    ctx.fillStyle = UIConstants.COLOR_TEXT;
    ctx.font = `${UIConstants.FONT_SIZE_LG} ${UIConstants.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('Zapisz do Menu', this.saveButtonRect.x + this.saveButtonRect.width / 2, this.saveButtonRect.y + this.saveButtonRect.height / 2);

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

    ctx.textAlign = 'left';
  }
}
