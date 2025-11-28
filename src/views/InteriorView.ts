import {gridToScreen, screenToGrid, TILE_HEIGHT_HALF, TILE_WIDTH_HALF} from '../systems/Isometric';
import {Furniture, PlacedFurniture} from '../model/Furniture';
import {PizzaCreator} from './PizzaCreator';
import {MenuManager} from './MenuManager';
import {Restaurant} from '../model/Restaurant';
import {AssetManager} from '../systems/AssetManager';
import {GameState} from '../model/GameState';
import {Employee} from '../model/Employee';
import {Customer} from '../model/Customer';
import {CustomerState, EmployeeRole, EmployeeState, OrderState} from '../model/enums';
import {FurniturePanel} from './ui/FurniturePanel';
import {StaffPanel} from './ui/StaffPanel';
import {InventoryPanel} from './ui/InventoryPanel';

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  lifeTime: number;
  maxLife: number;
}

// Layout Constants
const UI_LAYOUT = {
  BTN_KREATOR: {x: 10, y: 10, w: 150, h: 30},
  BTN_MENU: {x: 170, y: 10, w: 100, h: 30},
  BTN_MIASTO: {right: 10, y: 10, w: 140, h: 30}, // 'right' oznacza offset od prawej krawędzi
  HUD_STATS: {right: 170, y: 32} // Tekst statystyk
};

const TOP_BAR_HEIGHT = 50;
const SIDE_PANEL_WIDTH = 300;
const MASTER_TAB_HEIGHT = 40;

export class InteriorView {
  private ctx: CanvasRenderingContext2D;
  private activeRestaurant: Restaurant;
  private pizzaCreator: PizzaCreator;
  private menuManager: MenuManager;
  private assetManager: AssetManager;

  private selectedFurniture: Furniture | null = null;
  private mousePosition = {x: 0, y: 0};
  private activeTab: 'furniture' | 'staff' | 'inventory' = 'furniture';

  private floatingTexts: FloatingText[] = [];

  // Sub-panels
  private furniturePanel: FurniturePanel;
  private staffPanel: StaffPanel;
  private inventoryPanel: InventoryPanel;

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
    this.inventoryPanel = new InventoryPanel(assetManager);

    this.pizzaCreator.onSave = (pizza) => {
      this.activeRestaurant.menu.push(pizza);
      console.log(`Dodano pizzę ${pizza.name} do menu!`);
    };

    // Remove any legacy DOM elements if they exist
    const uiContainer = document.getElementById('interior-ui');
    if (uiContainer) uiContainer.style.display = 'none';
  }

  public showUI(): void {
    // Nothing to do for Canvas UI, handled in render
  }

  public hideUI(): void {
    this.selectedFurniture = null;
  }

  public addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      lifeTime: 2.0, // 2 seconds
      maxLife: 2.0
    });
  }

  public update(deltaTime: number): void {
    this.activeRestaurant.update(deltaTime);

    // Update Floating Texts
    const speed = 50; // pixels per second
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifeTime -= deltaTime;
      ft.y -= speed * deltaTime;
      if (ft.lifeTime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public render(): void {
    // Note: Render logic assumes the context transform is reset or managed by Game.ts
    // However, Game.ts does not clear transforms between views, so we should ensure we start clean or save/restore.
    // Ideally, Game.ts should handle this, but for safety we can reset here.
    // Since we use save/restore for the world, it should be fine.

    // Clear screen
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to ensure full clear
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
    const zIndexOffset = 0.1;

    // Add Furniture
    this.activeRestaurant.furniture.forEach(f => {
      let depth = f.gridX + f.gridY;
      // HACK: Carpets (ID 402) always on bottom
      if (f.id === 402) {
        depth -= 0.5;
      }
      renderList.push({
        type: 'furniture',
        obj: f,
        sortDepth: depth // Simple isometric depth
      });
    });

    // Add Employees
    this.activeRestaurant.employees.forEach(e => {
      renderList.push({
        type: 'employee',
        obj: e,
        sortDepth: e.gridX + e.gridY + zIndexOffset
      });
    });

    // Add Customers
    this.activeRestaurant.customers.forEach(c => {
      renderList.push({
        type: 'customer',
        obj: c,
        sortDepth: c.gridX + c.gridY + zIndexOffset
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
    this.renderUI(this.ctx);

    // Canvas UI Overlays that are "part of the scene" (like Creator)
    if (this.pizzaCreator.active) {
      this.pizzaCreator.render(this.ctx);
    }

    if (this.menuManager.active) {
      this.menuManager.render(this.ctx);
    }
    // Render Main UI Overlay

    // Draw Floating Texts (Topmost Layer)
    this.drawFloatingTexts();
  }

  /**
   * Main UI Rendering Method (Overlay)
   */
  private renderUI(ctx: CanvasRenderingContext2D): void {
    // Ensure we are in screen coordinates
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // 1. Top Bar Background
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, width, TOP_BAR_HEIGHT);

    // 2. Top Bar Buttons
    const btnKreator = UI_LAYOUT.BTN_KREATOR;
    const btnMenu = UI_LAYOUT.BTN_MENU;
    const btnMiasto = UI_LAYOUT.BTN_MIASTO;

    this.drawButton(ctx, btnKreator.x, btnKreator.y, btnKreator.w, btnKreator.h, '🍕 Kreator', '#e67e22');
    this.drawButton(ctx, btnMenu.x, btnMenu.y, btnMenu.w, btnMenu.h, '📜 Menu', '#27ae60');

    const cityX = width - btnMiasto.right - btnMiasto.w;
    this.drawButton(ctx, cityX, btnMiasto.y, btnMiasto.w, btnMiasto.h, '🏙️ Miasto', '#c0392b');

    // 3. Global HUD (Money & Time)
    const gameState = GameState.getInstance();
    const money = gameState.player.money;

    // --- CRITICAL FIX HERE: Usunięto nawiasy (), to jest pole, nie metoda ---
    const reputation = this.activeRestaurant.reputationSystem.averageRating.toFixed(1);

    const time = gameState.timeManager.getFormattedTime();

    const hudStats = UI_LAYOUT.HUD_STATS;
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    // Format: HH:MM | ★ 3.5 | $5000
    ctx.fillText(`${time} | ★ ${reputation} | $${money}`, width - hudStats.right, hudStats.y);

    // 4. Side Panel Container
    const panelX = width - SIDE_PANEL_WIDTH;
    const panelY = TOP_BAR_HEIGHT;
    const panelH = height - TOP_BAR_HEIGHT;

    // Draw Panel Background
    ctx.fillStyle = '#281e14'; // Match FurniturePanel bg
    ctx.fillRect(panelX, panelY, SIDE_PANEL_WIDTH, panelH);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, SIDE_PANEL_WIDTH, panelH);

    // 5. Master Tabs
    const tabWidth = SIDE_PANEL_WIDTH / 3;
    const tabs = [
      {key: 'furniture', label: '🏠'},
      {key: 'staff', label: '👥'},
      {key: 'inventory', label: '📦'}
    ];

    tabs.forEach((tab, index) => {
      const tX = panelX + index * tabWidth;
      const tY = panelY;
      const isActive = this.activeTab === tab.key;

      ctx.fillStyle = isActive ? '#A0522D' : '#553322';
      ctx.fillRect(tX, tY, tabWidth, MASTER_TAB_HEIGHT);
      ctx.strokeRect(tX, tY, tabWidth, MASTER_TAB_HEIGHT);

      ctx.fillStyle = '#FFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tX + tabWidth / 2, tY + MASTER_TAB_HEIGHT / 2);
    });

    // 6. Active Sub-Panel
    const contentY = panelY + MASTER_TAB_HEIGHT;
    const contentH = panelH - MASTER_TAB_HEIGHT;

    if (this.activeTab === 'furniture') {
      this.furniturePanel.render(ctx, panelX, contentY, SIDE_PANEL_WIDTH, contentH);
    } else if (this.activeTab === 'staff') {
      this.staffPanel.render(ctx, panelX, contentY, SIDE_PANEL_WIDTH, contentH, this.activeRestaurant);
    } else if (this.activeTab === 'inventory') {
      this.inventoryPanel.render(ctx, panelX, contentY, SIDE_PANEL_WIDTH, contentH, this.activeRestaurant);
    }
  }

  private drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  private drawFloatingTexts(): void {
    this.ctx.save();
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';

    this.floatingTexts.forEach(ft => {
      this.ctx.globalAlpha = Math.max(0, ft.lifeTime / ft.maxLife);

      // Shadow/Outline effect
      this.ctx.fillStyle = 'black';
      this.ctx.fillText(ft.text, ft.x + 1, ft.y + 1);

      this.ctx.fillStyle = ft.color;
      this.ctx.fillText(ft.text, ft.x, ft.y);
    });

    this.ctx.restore();
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
      // 1. Progress Bar (Working)
      if (employee.state === EmployeeState.Working && employee.currentOrder) {
        const barWidth = 40;
        const barHeight = 5;
        const barX = screenPos.x - barWidth / 2;
        const barY = drawY - 10;

        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(barX, barY, barWidth * (employee.currentOrder.progress / 100), barHeight);
      }

      // 2. Blocked Reason (Missing Ingredients)
      if (employee.blockedReason) {
         this.ctx.fillStyle = 'red';
         this.ctx.font = 'bold 20px Arial';
         this.ctx.textAlign = 'center';
         this.ctx.fillText('!', screenPos.x, drawY - 20);
         // Optional: Text description
         // this.ctx.font = '10px Arial';
         // this.ctx.fillText(employee.blockedReason, screenPos.x, drawY - 35);
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

    // --- Bubble Rendering ---
    if (customer.bubbleText) {
      const bubbleW = 100;
      const bubbleH = 30;
      const bubbleX = screenPos.x - bubbleW / 2;
      const bubbleY = drawY - 45; // Above head

      this.ctx.save();

      // Bubble Body
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = customer.bubbleColor;
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      // Check if roundRect exists (it's new in Canvas API)
      if (this.ctx.roundRect) {
         this.ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 5);
      } else {
         this.ctx.rect(bubbleX, bubbleY, bubbleW, bubbleH);
      }
      this.ctx.fill();
      this.ctx.stroke();

      // Tail
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, bubbleY + bubbleH);
      this.ctx.lineTo(screenPos.x - 5, bubbleY + bubbleH + 5);
      this.ctx.lineTo(screenPos.x + 5, bubbleY + bubbleH);
      this.ctx.fill(); // Fill tail specifically to hide outline overlap if needed, but fill is white anyway
      this.ctx.stroke();

      // Text
      this.ctx.fillStyle = customer.bubbleColor;
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(customer.bubbleText, screenPos.x, bubbleY + bubbleH / 2);

      this.ctx.restore();
    }
  }

  private drawFurniture(x: number, y: number, furniture: Furniture, isValid: boolean = true): void {
    let assetKey = furniture.assetKey;
    const rotation = furniture.rotation || 0;

    // Logika 4 kierunków:
    // 0: SE (Przód, Prawo)
    // 1: SW (Przód, Lewo - Flip)
    // 2: NW (Tył, Prawo)
    // 3: NE (Tył, Lewo - Flip)

    const isBackSide = rotation >= 2;
    const isFlipped = rotation % 2 !== 0;

    // Jeśli mebel jest obrócony tyłem (2 lub 3), próbujemy użyć assetu "_back"
    if (isBackSide) {
      const backKey = `${assetKey}_back`;
      // Sprawdź czy asset istnieje w managerze (wymaga rzutowania na string, bo TS pilnuje kluczy)
      if (this.assetManager.getAsset(backKey)) {
        assetKey = backKey;
      }
    }

    const img = this.assetManager.getAsset(assetKey);
    const screenPos = gridToScreen(x, y);

    if (img && img.naturalWidth > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = isValid ? 1.0 : 0.5;

      const drawX = screenPos.x - img.naturalWidth / 2;
      const drawY = screenPos.y + TILE_HEIGHT_HALF * 2 - img.naturalHeight;

      if (isFlipped) {
        // Odbicie lustrzane dla rotacji 1 i 3
        const centerX = drawX + img.naturalWidth / 2;
        this.ctx.translate(centerX, drawY);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(img, -img.naturalWidth / 2, 0);
      } else {
        // Normalne rysowanie dla 0 i 2
        this.ctx.drawImage(img, drawX, drawY);
      }

      this.ctx.restore();
    } else {
      // Fallback (gdy brak grafiki)
      this.ctx.save();
      this.ctx.globalAlpha = isValid ? 1.0 : 0.5;
      this.ctx.fillStyle = isValid ? furniture.color : 'red';

      // Przyciemnij tył w fallbacku
      if (isBackSide) this.ctx.filter = 'brightness(0.7)';

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
      this.ctx.restore();
    }
  }  private drawTile(x: number, y: number): void {
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
    // Scroll handling for panels?
    // We would need to pass this to active panel
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

    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;

    // 1. Top Bar Interaction
    if (clickY < TOP_BAR_HEIGHT) {
      const btnKreator = UI_LAYOUT.BTN_KREATOR;
      const btnMenu = UI_LAYOUT.BTN_MENU;
      const btnMiasto = UI_LAYOUT.BTN_MIASTO;

      // Kreator
      if (clickX >= btnKreator.x && clickX <= btnKreator.x + btnKreator.w &&
        clickY >= btnKreator.y && clickY <= btnKreator.y + btnKreator.h) {
        this.pizzaCreator.open();
        return;
      }
      // Menu
      if (clickX >= btnMenu.x && clickX <= btnMenu.x + btnMenu.w &&
        clickY >= btnMenu.y && clickY <= btnMenu.y + btnMenu.h) {
        this.menuManager.open();
        return;
      }
      // City
      const cityX = width - btnMiasto.right - btnMiasto.w;
      if (clickX >= cityX && clickX <= cityX + btnMiasto.w &&
        clickY >= btnMiasto.y && clickY <= btnMiasto.y + btnMiasto.h) {
        changeView(null);
        return;
      }
    }

    // 2. Side Panel Interaction
    const panelX = width - SIDE_PANEL_WIDTH;
    if (clickX >= panelX && clickY >= TOP_BAR_HEIGHT) {
      // Check Master Tabs
      if (clickY <= TOP_BAR_HEIGHT + MASTER_TAB_HEIGHT) {
        const tabWidth = SIDE_PANEL_WIDTH / 3;
        const localX = clickX - panelX;
        const index = Math.floor(localX / tabWidth);
        if (index === 0) this.activeTab = 'furniture';
        if (index === 1) this.activeTab = 'staff';
        if (index === 2) this.activeTab = 'inventory';
        return;
      }

      // Delegate to Sub-Panel
      const contentY = TOP_BAR_HEIGHT + MASTER_TAB_HEIGHT;
      const localX = clickX - panelX;
      const localY = clickY - contentY;

      if (this.activeTab === 'furniture') {
        const selected = this.furniturePanel.handleClick(localX, localY, SIDE_PANEL_WIDTH);
        if (selected) this.selectedFurniture = { ...selected, rotation: 0 }; // Clone to allow rotation without mutating catalog
      } else if (this.activeTab === 'staff') {
        this.staffPanel.handleClick(localX, localY, SIDE_PANEL_WIDTH, this.activeRestaurant);
      } else if (this.activeTab === 'inventory') {
        const cost = this.inventoryPanel.handleClick(localX, localY, SIDE_PANEL_WIDTH, this.activeRestaurant);
        if (cost > 0) {
           this.addFloatingText(this.mousePosition.x, this.mousePosition.y, `-$${cost}`, "red");
        }
      }
      return; // Consumed by UI
    }

  }

  public handleMouseDown(event: MouseEvent): void {
    if (this.pizzaCreator.active) return;

    // UI Blocking
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    const panelX = width - SIDE_PANEL_WIDTH;
    const clickX = event.clientX - this.ctx.canvas.getBoundingClientRect().left;
    const clickY = event.clientY - this.ctx.canvas.getBoundingClientRect().top;
    const isOverUI = (clickY < TOP_BAR_HEIGHT) || (clickX >= panelX && clickY >= TOP_BAR_HEIGHT);

    if (isOverUI) return;

    // World Interaction
    if (this.selectedFurniture) {
      if (event.button === 2) { // PRAWY KLIK (ROTACJA)
        const currentRot = this.selectedFurniture.rotation || 0;
        const nextRot = (currentRot + 1) % 4; // Cykl: 0 -> 1 -> 2 -> 3 -> 0
        this.selectedFurniture.rotation = nextRot;

        // Zamieniamy wymiary ZAWSZE przy każdej zmianie o 90 stopni
        // Ponieważ logicznie siatka zawsze obraca się o 90 względem poprzedniego stanu
        const temp = this.selectedFurniture.width;
        this.selectedFurniture.width = this.selectedFurniture.height;
        this.selectedFurniture.height = temp;

        console.log(`Rotacja: ${nextRot} (${this.selectedFurniture.width}x${this.selectedFurniture.height})`);
        return;
      }

      if (event.button === 0) { // LEWY KLIK (STAWIANIE)
        const interiorOffsetX = this.ctx.canvas.width / 2;
        const interiorOffsetY = this.ctx.canvas.height / 4;
        const screenX = this.mousePosition.x - interiorOffsetX;
        const screenY = this.mousePosition.y - interiorOffsetY;
        const gridPos = screenToGrid(screenX, screenY);
        const gridX = Math.floor(gridPos.x);
        const gridY = Math.floor(gridPos.y);

        const player = GameState.getInstance().player;
        if (player.money >= this.selectedFurniture.price) {
          // Klonujemy ponownie przy stawianiu, aby "duch" w ręce zachował swoją rotację
          const furnitureToPlace = { ...this.selectedFurniture };

          const success = this.activeRestaurant.addFurniture(furnitureToPlace, gridX, gridY);
          if (success) {
            player.spendMoney(this.selectedFurniture.price);
            this.addFloatingText(this.mousePosition.x, this.mousePosition.y, `-$${this.selectedFurniture.price}`, "red");
          }
        } else {
          this.addFloatingText(this.mousePosition.x, this.mousePosition.y, "Brak kasy!", "red");
        }
      }
    }
  }}
