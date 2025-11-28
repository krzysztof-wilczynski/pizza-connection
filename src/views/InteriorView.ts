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

  // UI Elements
  private uiContainer: HTMLElement | null;
  private btnBack: HTMLElement | null;
  private btnCreator: HTMLElement | null;
  private btnMenu: HTMLElement | null;

  private tabFurniture: HTMLElement | null;
  private tabStaff: HTMLElement | null;
  private tabInventory: HTMLElement | null;

  private contentFurniture: HTMLElement | null;
  private contentStaff: HTMLElement | null;
  private contentInventory: HTMLElement | null;

  // View Change Callback
  private changeViewCallback: ((newView: any) => void) | null = null;

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
    this.furniturePanel = new FurniturePanel(assetManager, (furniture) => {
        this.selectedFurniture = furniture;
    });
    this.staffPanel = new StaffPanel();
    this.inventoryPanel = new InventoryPanel();

    this.pizzaCreator.onSave = (pizza) => {
      this.activeRestaurant.menu.push(pizza);
      console.log(`Dodano pizzę ${pizza.name} do menu!`);
    };

    // Grab UI Elements
    this.uiContainer = document.getElementById('interior-ui');
    this.btnBack = document.getElementById('btn-back');
    this.btnCreator = document.getElementById('btn-creator');
    this.btnMenu = document.getElementById('btn-menu');

    this.tabFurniture = document.getElementById('tab-furniture');
    this.tabStaff = document.getElementById('tab-staff');
    this.tabInventory = document.getElementById('tab-inventory');

    this.contentFurniture = document.getElementById('furniture-content');
    this.contentStaff = document.getElementById('staff-content');
    this.contentInventory = document.getElementById('inventory-content');

    this.initUI();
    this.showUI();
  }

  private initUI(): void {
      if (this.btnBack) this.btnBack.onclick = () => {
          if (this.changeViewCallback) this.changeViewCallback(null);
      };

      if (this.btnCreator) this.btnCreator.onclick = () => {
          this.pizzaCreator.open();
      };

      if (this.btnMenu) this.btnMenu.onclick = () => {
          this.menuManager.open();
      };

      // Tabs
      if (this.tabFurniture) this.tabFurniture.onclick = () => this.switchTab('furniture');
      if (this.tabStaff) this.tabStaff.onclick = () => this.switchTab('staff');
      if (this.tabInventory) this.tabInventory.onclick = () => this.switchTab('inventory');
  }

  private switchTab(tab: 'furniture' | 'staff' | 'inventory'): void {
      this.activeTab = tab;
      this.selectedFurniture = null;

      // Update Tab Classes
      if (this.tabFurniture) this.tabFurniture.classList.toggle('active', tab === 'furniture');
      if (this.tabStaff) this.tabStaff.classList.toggle('active', tab === 'staff');
      if (this.tabInventory) this.tabInventory.classList.toggle('active', tab === 'inventory');

      // Update Content Visibility
      if (this.contentFurniture) this.contentFurniture.style.display = tab === 'furniture' ? 'block' : 'none';
      if (this.contentStaff) this.contentStaff.style.display = tab === 'staff' ? 'block' : 'none';
      if (this.contentInventory) this.contentInventory.style.display = tab === 'inventory' ? 'block' : 'none';

      // Update Panel Contents
      if (tab === 'furniture') this.furniturePanel.updateHTML();
      if (tab === 'staff') this.staffPanel.updateHTML(this.activeRestaurant);
      if (tab === 'inventory') this.inventoryPanel.updateHTML(this.activeRestaurant);
  }

  public showUI(): void {
      if (this.uiContainer) this.uiContainer.style.display = 'block';
      this.switchTab(this.activeTab); // Initialize first tab
  }

  public hideUI(): void {
      if (this.uiContainer) this.uiContainer.style.display = 'none';
      this.selectedFurniture = null;
  }

  public update(deltaTime: number): void {
    this.activeRestaurant.update(deltaTime);

    // Update Panels if needed (e.g. inventory counts changing)
    if (this.activeTab === 'staff') this.staffPanel.updateHTML(this.activeRestaurant);
    if (this.activeTab === 'inventory') this.inventoryPanel.updateHTML(this.activeRestaurant);
  }

  public render(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = '#6B4F35';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    const interiorOffsetX = this.ctx.canvas.width / 2;
    const interiorOffsetY = this.ctx.canvas.height / 4;

    this.ctx.save();
    this.ctx.translate(interiorOffsetX, interiorOffsetY);

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

    // Canvas UI Overlays that are "part of the scene" (like Creator)
    this.pizzaCreator.render(this.ctx);
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
    // MenuManager is now HTML based
    // if (this.menuManager.active) {
    //   this.menuManager.handleWheel(event);
    // }
  }

  public handleMouseClick(event: MouseEvent, changeView: (newView: any) => void): void {
    this.changeViewCallback = changeView;
    const rect = this.ctx.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (this.pizzaCreator.active) {
      this.pizzaCreator.handleMouseClick(event);
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
}
