import {gridToScreen, screenToGrid, TILE_HEIGHT_HALF, TILE_WIDTH_HALF} from '../systems/Isometric';
import {Furniture, PlacedFurniture} from '../model/Furniture';
import {PizzaCreator} from './PizzaCreator';
import {MenuManager} from './MenuManager';
import {Restaurant} from '../model/Restaurant';
import {AssetManager} from '../systems/AssetManager';
import {GameState} from '../model/GameState';
import {Employee} from '../model/Employee';
import {Customer} from '../model/Customer';
import {EmployeeRole, EmployeeState, CustomerState, OrderState} from '../model/enums';
import { FurniturePanel } from './ui/FurniturePanel';
import { StaffPanel } from './ui/StaffPanel';
import { InventoryPanel } from './ui/InventoryPanel';

const BACK_BUTTON_WIDTH = 180;
const BACK_BUTTON_HEIGHT = 50;
const BACK_BUTTON_MARGIN = 20;

const FURNITURE_PANEL_WIDTH = 250;

const BTN_CREATOR_RECT = {x: 10, y: 10, w: 200, h: 50};
const BTN_MENU_RECT = {x: 220, y: 10, w: 100, h: 50};
const BTN_BACK_RECT = {x: 330, y: 10, w: 180, h: 50};

export class InteriorView {
  private ctx: CanvasRenderingContext2D;
  private activeRestaurant: Restaurant;
  private pizzaCreator: PizzaCreator;
  private menuManager: MenuManager;
  private assetManager: AssetManager;

  private selectedFurniture: Furniture | null = null;
  private mousePosition = {x: 0, y: 0};
  private activeTab: 'furniture' | 'staff' | 'inventory' = 'furniture';

  // Sub-panels
  private furniturePanel: FurniturePanel;
  private staffPanel: StaffPanel;
  private inventoryPanel: InventoryPanel;

  constructor(
    ctx: CanvasRenderingContext2D,
    activeRestaurant: Restaurant,
    pizzaCreator: PizzaCreator,
    assetManager: AssetManager
  ) {
    this.ctx = ctx;
    this.activeRestaurant = activeRestaurant;
    this.pizzaCreator = pizzaCreator;
    this.assetManager = assetManager;
    this.menuManager = new MenuManager(this.activeRestaurant);

    // Initialize Panels
    this.furniturePanel = new FurniturePanel(ctx.canvas.width, ctx.canvas.height, assetManager);
    this.staffPanel = new StaffPanel(ctx.canvas.width, ctx.canvas.height);
    this.inventoryPanel = new InventoryPanel(ctx.canvas.width, ctx.canvas.height);

    this.pizzaCreator.onSave = (pizza) => {
      this.activeRestaurant.menu.push(pizza);
      console.log(`Dodano pizzę ${pizza.name} do menu!`);
    };
  }

  public update(deltaTime: number): void {
    this.activeRestaurant.update(deltaTime);
  }

  public render(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = '#6B4F35';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    const interiorOffsetX = this.ctx.canvas.width / 2;
    const interiorOffsetY = this.ctx.canvas.height / 4;

    this.ctx.save();
    this.ctx.translate(interiorOffsetX, interiorOffsetY);

    // Draw Walls (Background)
    const wallCorner = this.assetManager.getAsset('interior_wall_corner');
    const wallLeft = this.assetManager.getAsset('interior_wall_left');
    const wallRight = this.assetManager.getAsset('interior_wall_right');

    // Corner (0,0)
    if (wallCorner) {
      const screenPos = gridToScreen(0, 0);
      this.ctx.drawImage(
        wallCorner,
        screenPos.x - wallCorner.naturalWidth / 2,
        screenPos.y - wallCorner.naturalHeight + TILE_HEIGHT_HALF
      );
    }

    // Left Walls (col=0, row>0)
    if (wallLeft) {
      for (let row = 1; row < 10; row++) {
        const screenPos = gridToScreen(0, row);
        this.ctx.drawImage(
          wallLeft,
          screenPos.x - wallLeft.naturalWidth / 2,
          screenPos.y - wallLeft.naturalHeight + TILE_HEIGHT_HALF
        );
      }
    }

    // Right Walls (row=0, col>0)
    if (wallRight) {
      for (let col = 1; col < 10; col++) {
        const screenPos = gridToScreen(col, 0);
        this.ctx.drawImage(
          wallRight,
          screenPos.x - wallRight.naturalWidth / 2,
          screenPos.y - wallRight.naturalHeight + TILE_HEIGHT_HALF
        );
      }
    }

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const screenPos = gridToScreen(col, row);
        this.drawTile(screenPos.x, screenPos.y);
      }
    }

    // Combined Rendering with Z-Sorting
    const renderList: { type: 'furniture' | 'employee' | 'customer', obj: any, sortDepth: number }[] = [];

    // Add Furniture
    this.activeRestaurant.furniture.forEach(f => {
      renderList.push({
        type: 'furniture',
        obj: f,
        sortDepth: f.gridX + f.gridY // Simple isometric depth
      });
    });

    // Add Employees
    this.activeRestaurant.employees.forEach(e => {
      renderList.push({
        type: 'employee',
        obj: e,
        sortDepth: e.gridX + e.gridY
      });
    });

    // Add Customers
    this.activeRestaurant.customers.forEach(c => {
      renderList.push({
        type: 'customer',
        obj: c,
        sortDepth: c.gridX + c.gridY
      });
    });

    // Sort by depth
    renderList.sort((a, b) => a.sortDepth - b.sortDepth);

    // Draw sorted
    renderList.forEach(item => {
      if (item.type === 'furniture') {
        const f = item.obj as PlacedFurniture;
        this.drawFurniture(f.gridX, f.gridY, f);
      } else if (item.type === 'employee') {
        const e = item.obj as Employee;
        this.drawEmployee(e);
      } else if (item.type === 'customer') {
        const c = item.obj as Customer;
        this.drawCustomer(c);
      }
    });

    this.drawFurnitureGhost(interiorOffsetX, interiorOffsetY);

    this.ctx.restore();

    this.drawTempUI();
    this.pizzaCreator.render(this.ctx);
    this.menuManager.render(this.ctx);
  }


  private drawTempUI(): void {
    // Creator Button
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(BTN_CREATOR_RECT.x, BTN_CREATOR_RECT.y, BTN_CREATOR_RECT.w, BTN_CREATOR_RECT.h);
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Otwórz Kreator Pizzy', BTN_CREATOR_RECT.x + BTN_CREATOR_RECT.w/2, 40);

    // Menu Button
    this.ctx.fillStyle = '#8e44ad';
    this.ctx.fillRect(BTN_MENU_RECT.x, BTN_MENU_RECT.y, BTN_MENU_RECT.w, BTN_MENU_RECT.h);
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.fillText('Menu', BTN_MENU_RECT.x + BTN_MENU_RECT.w/2, 40);

    this.ctx.textAlign = 'left';

    // Money HUD
    const money = GameState.getInstance().player.money;
    this.ctx.fillStyle = '#f1c40f'; // Gold color
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`$${money.toLocaleString()}`, this.ctx.canvas.width / 2, 35);
    this.ctx.textAlign = 'left';

    this.drawBackButton();
    this.drawTabButtons();

    if (this.activeTab === 'furniture') {
      this.furniturePanel.render(this.ctx);
    } else if (this.activeTab === 'staff') {
      this.staffPanel.render(this.ctx);
    } else if (this.activeTab === 'inventory') {
      this.inventoryPanel.render(this.ctx, this.activeRestaurant);
    }
  }

  private drawTabButtons(): void {
    const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;

    // Background for tabs
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(panelX, 0, FURNITURE_PANEL_WIDTH, 40);

    const tabWidth = FURNITURE_PANEL_WIDTH / 3;

    // Furniture Tab
    this.ctx.fillStyle = this.activeTab === 'furniture' ? '#666' : '#444';
    this.ctx.fillRect(panelX, 0, tabWidth, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Meble', panelX + tabWidth / 2, 20);

    // Staff Tab
    this.ctx.fillStyle = this.activeTab === 'staff' ? '#666' : '#444';
    this.ctx.fillRect(panelX + tabWidth, 0, tabWidth, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Ludzie', panelX + tabWidth * 1.5, 20);

    // Inventory Tab
    this.ctx.fillStyle = this.activeTab === 'inventory' ? '#666' : '#444';
    this.ctx.fillRect(panelX + tabWidth * 2, 0, tabWidth, 40);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Spiżarnia', panelX + tabWidth * 2.5, 20);
  }

  private drawFurnitureGhost(interiorOffsetX: number, interiorOffsetY: number): void {
    if (!this.selectedFurniture) return;

    const screenX = this.mousePosition.x - interiorOffsetX;
    const screenY = this.mousePosition.y - interiorOffsetY;
    const gridPos = screenToGrid(screenX, screenY);
    const gridX = Math.floor(gridPos.x);
    const gridY = Math.floor(gridPos.y);

    let isValid = true;
    if (gridX < 0 || gridY < 0 || gridX + this.selectedFurniture.width > 10 || gridY + this.selectedFurniture.height > 10) {
      isValid = false;
    } else {
      for (const placed of this.activeRestaurant.furniture) {
        if (
          gridX < placed.gridX + placed.width &&
          gridX + this.selectedFurniture.width > placed.gridX &&
          gridY < placed.gridY + placed.height &&
          gridY + this.selectedFurniture.height > placed.gridY
        ) {
          isValid = false;
          break;
        }
      }
    }

    // Draw ghost
    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    this.drawFurniture(gridX, gridY, this.selectedFurniture, true);

    if (!isValid) {
      const p1 = gridToScreen(gridX, gridY);
      const p2 = gridToScreen(gridX + this.selectedFurniture.width, gridY);
      const p3 = gridToScreen(gridX + this.selectedFurniture.width, gridY + this.selectedFurniture.height);
      const p4 = gridToScreen(gridX, gridY + this.selectedFurniture.height);

      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.lineTo(p3.x, p3.y);
      this.ctx.lineTo(p4.x, p4.y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawBackButton(): void {
    const x = BACK_BUTTON_MARGIN;
    const y = this.ctx.canvas.height - BACK_BUTTON_HEIGHT - BACK_BUTTON_MARGIN;
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(BTN_BACK_RECT.x, BTN_BACK_RECT.y, BTN_BACK_RECT.w, BTN_BACK_RECT.h);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Powrót do Miasta', x + BACK_BUTTON_WIDTH / 2, y + BACK_BUTTON_HEIGHT / 2);
  }

  private drawEmployee(employee: Employee): void {
    const img = this.assetManager.getAsset(employee.assetKey);
    const screenPos = gridToScreen(employee.gridX, employee.gridY);

    const drawX = img && img.naturalWidth > 0 ? screenPos.x - img.naturalWidth / 2 : screenPos.x - 10;
    const drawY = img && img.naturalWidth > 0 ? screenPos.y + TILE_HEIGHT_HALF * 2 - img.naturalHeight : screenPos.y - 40;

    if (img && img.naturalWidth > 0) {
      this.ctx.drawImage(img, drawX, drawY);
    } else {
      this.ctx.fillStyle = employee.role === EmployeeRole.Chef ? 'white' : 'black';
      this.ctx.fillRect(drawX, drawY, 20, 40);
    }

    // --- Visual Indicators ---
    if (employee.role === EmployeeRole.Chef) {
      if (employee.state === EmployeeState.Working && employee.currentOrder) {
        const barWidth = 40;
        const barHeight = 5;
        const barX = screenPos.x - barWidth / 2;
        const barY = drawY - 10;

        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(barX, barY, barWidth * (employee.currentOrder.progress / 100), barHeight);
      } else if (employee.state === EmployeeState.Idle) {
        const hasPendingOrders = this.activeRestaurant.kitchenQueue.some(o => o.state === OrderState.Pending);
        if (hasPendingOrders) {
          const blockedOrder = this.activeRestaurant.kitchenQueue.find(o =>
            o.state === OrderState.Pending && !this.activeRestaurant.hasIngredientsFor(o.pizza)
          );

          if (blockedOrder) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('!', screenPos.x, drawY - 10);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.strokeText('!', screenPos.x, drawY - 10);
          }
        }
      }
    }

    if (employee.role === EmployeeRole.Waiter && employee.currentOrder && employee.state === EmployeeState.Walking) {
      const pizzaIcon = this.assetManager.getAsset('pizza_icon');
      if (pizzaIcon && pizzaIcon.naturalWidth > 0) {
        this.ctx.drawImage(pizzaIcon, screenPos.x, drawY - 20, 20, 20);
      } else {
        this.ctx.fillStyle = 'orange';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, drawY - 20, 10, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawCustomer(customer: Customer): void {
    const img = this.assetManager.getAsset(customer.assetKey);
    const screenPos = gridToScreen(customer.gridX, customer.gridY);

    const drawX = img && img.naturalWidth > 0 ? screenPos.x - img.naturalWidth / 2 : screenPos.x - 10;
    const drawY = img && img.naturalWidth > 0 ? screenPos.y + TILE_HEIGHT_HALF * 2 - img.naturalHeight : screenPos.y - 40;

    if (img && img.naturalWidth > 0) {
      this.ctx.drawImage(img, drawX, drawY);
    } else {
      this.ctx.fillStyle = 'blue';
      this.ctx.fillRect(drawX, drawY, 20, 40);
    }

    if (customer.state === CustomerState.WaitingForFood) {
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, drawY - 15, 8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, drawY - 15);
      this.ctx.lineTo(screenPos.x, drawY - 20);
      this.ctx.moveTo(screenPos.x, drawY - 15);
      this.ctx.lineTo(screenPos.x + 4, drawY - 15);
      this.ctx.stroke();
    }
  }

  private drawFurniture(x: number, y: number, furniture: Furniture, isValid: boolean = true): void {
    const img = this.assetManager.getAsset(furniture.assetKey);
    const screenPos = gridToScreen(x, y);

    if (img && img.naturalWidth > 0) {
      this.ctx.globalAlpha = isValid ? 1.0 : 0.5;
      const drawX = screenPos.x - img.naturalWidth / 2;
      const drawY = screenPos.y + TILE_HEIGHT_HALF * 2 - img.naturalHeight;
      this.ctx.drawImage(img, drawX, drawY);
      this.ctx.globalAlpha = 1.0;
    } else {
      this.ctx.globalAlpha = isValid ? 1.0 : 0.5;
      this.ctx.fillStyle = isValid ? furniture.color : 'red';
      for (let row = 0; row < furniture.height; row++) {
        for (let col = 0; col < furniture.width; col++) {
          const tPos = gridToScreen(x + col, y + row);
          this.ctx.beginPath();
          this.ctx.moveTo(tPos.x, tPos.y);
          this.ctx.lineTo(tPos.x + TILE_WIDTH_HALF, tPos.y + TILE_HEIGHT_HALF);
          this.ctx.lineTo(tPos.x, tPos.y + TILE_HEIGHT_HALF * 2);
          this.ctx.lineTo(tPos.x - TILE_WIDTH_HALF, tPos.y + TILE_HEIGHT_HALF);
          this.ctx.closePath();
          this.ctx.fill();
        }
      }
      this.ctx.globalAlpha = 1.0;
    }
  }

  private drawTile(x: number, y: number): void {
    const floor = this.assetManager.getAsset('floor');
    if (floor && floor.naturalWidth > 0) {
      this.ctx.drawImage(floor, x - floor.naturalWidth / 2, y);
    } else {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
      this.ctx.lineTo(x, y + TILE_HEIGHT_HALF * 2);
      this.ctx.lineTo(x - TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
      this.ctx.closePath();
      this.ctx.fillStyle = '#9c8256';
      this.ctx.fill();
      this.ctx.strokeStyle = '#555';
      this.ctx.stroke();
    }
  }

  public handleMouseMove(event: MouseEvent): void {
    const rect = this.ctx.canvas.getBoundingClientRect();
    this.mousePosition.x = event.clientX - rect.left;
    this.mousePosition.y = event.clientY - rect.top;

    if (this.pizzaCreator.active) {
      this.pizzaCreator.handleMouseMove(event);
    }
  }

  public handleWheel(event: WheelEvent): void {
    if (this.menuManager.active) {
      this.menuManager.handleWheel(event);
    }
  }

  public handleMouseClick(event: MouseEvent, changeView: (newView: any) => void): void {
    const rect = this.ctx.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check Global Back Button first
    const backBtnY = this.ctx.canvas.height - BACK_BUTTON_HEIGHT - BACK_BUTTON_MARGIN;
    if (clickX >= BACK_BUTTON_MARGIN && clickX <= BACK_BUTTON_MARGIN + BACK_BUTTON_WIDTH &&
      clickY >= backBtnY && clickY <= backBtnY + BACK_BUTTON_HEIGHT) {
      changeView(null);
      return;
    }

    const mousePos = {x: clickX, y: clickY};

    const isInside = (pos: { x: number, y: number }, rect: { x: number, y: number, w: number, h: number }) => {
      return pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h;
    };

    if (this.menuManager.active) {
      this.menuManager.handleMouseClick(event);
      return;
    }

    if (this.pizzaCreator.active) {
      this.pizzaCreator.handleMouseClick(event);
      return;
    }

    // Buttons
    if (isInside(mousePos, BTN_CREATOR_RECT)) {
      this.pizzaCreator.open();
      return;
    }
    if (isInside(mousePos, BTN_MENU_RECT)) {
      this.menuManager.open();
      return;
    }
    if (isInside(mousePos, BTN_BACK_RECT)) {
      changeView(null);
      return;
    }

    // Panel Interactions
    const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;
    if (clickX >= panelX) {
      // Tab Selection
      if (clickY < 40) {
        const tabWidth = FURNITURE_PANEL_WIDTH / 3;
        if (clickX < panelX + tabWidth) {
          this.activeTab = 'furniture';
        } else if (clickX < panelX + tabWidth * 2) {
          this.activeTab = 'staff';
          this.selectedFurniture = null;
        } else {
          this.activeTab = 'inventory';
          this.selectedFurniture = null;
        }
        return;
      }

      // Panel Content Interaction
      if (this.activeTab === 'furniture') {
        const selected = this.furniturePanel.handleClick(clickX, clickY);
        if (selected) {
          this.selectedFurniture = selected;
        }
      } else if (this.activeTab === 'staff') {
        this.staffPanel.handleClick(clickX, clickY, this.activeRestaurant);
      } else if (this.activeTab === 'inventory') {
        this.inventoryPanel.handleClick(clickX, clickY, this.activeRestaurant);
      }
      return;
    }

    // World Interaction (Placing Furniture)
    if (this.selectedFurniture) {
      if (event.button === 2) { // Right click
        this.selectedFurniture = null;
        return;
      }
      const interiorOffsetX = this.ctx.canvas.width / 2;
      const interiorOffsetY = this.ctx.canvas.height / 4;
      const screenX = this.mousePosition.x - interiorOffsetX;
      const screenY = this.mousePosition.y - interiorOffsetY;
      const gridPos = screenToGrid(screenX, screenY);
      const gridX = Math.floor(gridPos.x);
      const gridY = Math.floor(gridPos.y);

      const player = GameState.getInstance().player;
      if (player.money >= this.selectedFurniture.price) {
        const success = this.activeRestaurant.addFurniture(this.selectedFurniture, gridX, gridY);
        if (success) {
          player.spendMoney(this.selectedFurniture.price);
          console.log("Cha-ching!");
          this.selectedFurniture = null;
        }
      } else {
        console.log("Not enough money");
      }
    }
  }

  public hideUI(): void {
  }
}
