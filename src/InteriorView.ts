import { gridToScreen, screenToGrid, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { Furniture } from './model/Furniture';
import { FURNITURE_CATALOG } from './model/FurnitureCatalog';
import { PizzaCreator } from './PizzaCreator';
import { Restaurant } from './model/Restaurant';
import { AssetManager } from './AssetManager';
import { GameState } from './model/GameState';
import { Employee } from './model/Employee';
import { Customer } from './model/Customer';
import { EmployeeRole, EmployeeState, CustomerState } from './model/enums';

const BACK_BUTTON_WIDTH = 180;
const BACK_BUTTON_HEIGHT = 50;
const BACK_BUTTON_MARGIN = 20;

const FURNITURE_PANEL_WIDTH = 250;
const FURNITURE_ITEM_HEIGHT = 60;
const FURNITURE_ITEM_MARGIN = 10;

// Recruitment UI Constants
const RECRUIT_PANEL_WIDTH = 200;
const RECRUIT_BTN_HEIGHT = 50;
const RECRUIT_BTN_MARGIN = 10;

export class InteriorView {
    private ctx: CanvasRenderingContext2D;
    private activeRestaurant: Restaurant;
    private pizzaCreator: PizzaCreator;
    private assetManager: AssetManager;

    private selectedFurniture: Furniture | null = null;
    private mousePosition = { x: 0, y: 0 };
    private activeTab: 'furniture' | 'staff' = 'furniture';

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
    }

    public update(deltaTime: number): void {
        // Interior-specific update logic
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
                const f = item.obj as Furniture;
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
    }

    private drawTempUI(): void {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(10, 10, 200, 50);
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Otwórz Kreator Pizzy', 110, 40);
        this.ctx.textAlign = 'left';

        this.drawBackButton();
        this.drawTabButtons();
        if (this.activeTab === 'furniture') {
            this.drawFurniturePanel();
        } else {
            this.drawStaffPanel();
        }
    }

    private drawTabButtons(): void {
        const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;
        const tabY = this.ctx.canvas.height - 50; // Bottom of panel area, or distinct area
        // Let's put tabs at the top of the side panel

        // Background for tabs
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(panelX, 0, FURNITURE_PANEL_WIDTH, 40);

        const tabWidth = FURNITURE_PANEL_WIDTH / 2;

        // Furniture Tab
        this.ctx.fillStyle = this.activeTab === 'furniture' ? '#666' : '#444';
        this.ctx.fillRect(panelX, 0, tabWidth, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Meble', panelX + tabWidth/2, 20);

        // Staff Tab
        this.ctx.fillStyle = this.activeTab === 'staff' ? '#666' : '#444';
        this.ctx.fillRect(panelX + tabWidth, 0, tabWidth, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Ludzie', panelX + tabWidth * 1.5, 20);
    }

    private drawFurniturePanel(): void {
        const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;
        const panelY = 40; // Below tabs

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX, panelY, FURNITURE_PANEL_WIDTH, this.ctx.canvas.height - panelY);

        const playerMoney = GameState.getInstance().player.money;

        FURNITURE_CATALOG.forEach((item, index) => {
            const itemY = panelY + (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * index + FURNITURE_ITEM_MARGIN;
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(panelX + FURNITURE_ITEM_MARGIN, itemY, FURNITURE_PANEL_WIDTH - 2 * FURNITURE_ITEM_MARGIN, FURNITURE_ITEM_HEIGHT);

            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(panelX + FURNITURE_ITEM_MARGIN * 2, itemY + FURNITURE_ITEM_MARGIN, 40, 40);

            const canAfford = playerMoney >= item.price;
            this.ctx.fillStyle = canAfford ? 'white' : '#ff4444';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(item.name, panelX + FURNITURE_ITEM_MARGIN * 3 + 40, itemY + FURNITURE_ITEM_MARGIN);

            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = canAfford ? '#ccc' : '#ff4444';
            this.ctx.fillText(`$${item.price}`, panelX + FURNITURE_ITEM_MARGIN * 3 + 40, itemY + FURNITURE_ITEM_MARGIN + 20);
        });
    }

    private drawStaffPanel(): void {
        const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;
        const panelY = 40; // Below tabs

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX, panelY, FURNITURE_PANEL_WIDTH, this.ctx.canvas.height - panelY);

        const candidates = [
            { role: 'Kucharz', cost: 500, type: EmployeeRole.Chef },
            { role: 'Kelner', cost: 300, type: EmployeeRole.Waiter }
        ];

        const playerMoney = GameState.getInstance().player.money;

        candidates.forEach((cand, index) => {
            const itemY = panelY + (RECRUIT_BTN_HEIGHT + RECRUIT_BTN_MARGIN) * index + RECRUIT_BTN_MARGIN;

            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(panelX + RECRUIT_BTN_MARGIN, itemY, FURNITURE_PANEL_WIDTH - 2 * RECRUIT_BTN_MARGIN, RECRUIT_BTN_HEIGHT);

            const canAfford = playerMoney >= cand.cost;
            this.ctx.fillStyle = canAfford ? 'white' : '#ff4444';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(cand.role, panelX + 20, itemY + RECRUIT_BTN_HEIGHT / 2);

            this.ctx.textAlign = 'right';
            this.ctx.fillText(`$${cand.cost}`, panelX + FURNITURE_PANEL_WIDTH - 20, itemY + RECRUIT_BTN_HEIGHT / 2);
        });
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

        this.drawFurniture(gridX, gridY, this.selectedFurniture, isValid);
    }

    private drawBackButton(): void {
        const x = BACK_BUTTON_MARGIN;
        const y = BACK_BUTTON_MARGIN;
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x, y, BACK_BUTTON_WIDTH, BACK_BUTTON_HEIGHT);
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
             // Fallback rectangle
             this.ctx.fillStyle = employee.role === EmployeeRole.Chef ? 'white' : 'black';
             this.ctx.fillRect(drawX, drawY, 20, 40);
        }

        // --- Visual Indicators ---
        // Chef: Working -> Progress Bar
        if (employee.role === EmployeeRole.Chef && employee.state === EmployeeState.Working && employee.currentOrder) {
            const barWidth = 40;
            const barHeight = 5;
            const barX = screenPos.x - barWidth / 2;
            const barY = drawY - 10;

            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(barX, barY, barWidth * (employee.currentOrder.progress / employee.currentOrder.maxProgress), barHeight);
        }

        // Waiter: Walking with food -> Pizza Icon
        // Check if waiter has an order that is ready or served (meaning they are carrying it)
        // In our logic, if they have an order and are walking to customer, the order state is still Ready (removed from counter) or Served?
        // Waiter logic: "Jak dojdzie do klienta: Usuń order z systemu." so while walking it is still "currentOrder"
        if (employee.role === EmployeeRole.Waiter && employee.currentOrder && employee.state === EmployeeState.Walking) {
             // We want to show pizza only if they have picked it up.
             // Our logic: Walk to Counter (no order in hand, but target set).
             // Then Pickup -> Walk to Customer (has currentOrder).
             // So if `currentOrder` is not null, they are carrying it.
            const pizzaIcon = this.assetManager.getAsset('pizza_icon'); // Assumption: asset exists or we draw circle
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
            // Fallback for customer
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(drawX, drawY, 20, 40);
        }

        // --- Visual Indicators ---
        // WaitingForFood -> Clock/Icon
        if (customer.state === CustomerState.WaitingForFood) {
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, drawY - 15, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw clock hands (static for now)
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
    }

    public handleMouseClick(event: MouseEvent, changeView: (newView: any) => void): void {
        const rect = this.ctx.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (clickX >= BACK_BUTTON_MARGIN && clickX <= BACK_BUTTON_MARGIN + BACK_BUTTON_WIDTH &&
            clickY >= BACK_BUTTON_MARGIN && clickY <= BACK_BUTTON_MARGIN + BACK_BUTTON_HEIGHT) {
            changeView(null);
            return;
        }

        const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;
        if (clickX >= panelX) {
            // Handle Tab Clicks
            if (clickY < 40) {
                 if (clickX < panelX + FURNITURE_PANEL_WIDTH / 2) {
                     this.activeTab = 'furniture';
                 } else {
                     this.activeTab = 'staff';
                     this.selectedFurniture = null; // Clear selection when switching tabs
                 }
                 return;
            }

            // Handle Panel Clicks
            if (this.activeTab === 'furniture') {
                FURNITURE_CATALOG.forEach((item, i) => {
                    const itemY = 40 + (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * i + FURNITURE_ITEM_MARGIN;
                    if (clickY >= itemY && clickY <= itemY + FURNITURE_ITEM_HEIGHT) {
                        this.selectedFurniture = { ...item };
                    }
                });
            } else {
                const candidates = [
                    { role: 'Kucharz', cost: 500, type: EmployeeRole.Chef },
                    { role: 'Kelner', cost: 300, type: EmployeeRole.Waiter }
                ];
                candidates.forEach((cand, i) => {
                     const itemY = 40 + (RECRUIT_BTN_HEIGHT + RECRUIT_BTN_MARGIN) * i + RECRUIT_BTN_MARGIN;
                     if (clickY >= itemY && clickY <= itemY + RECRUIT_BTN_HEIGHT) {
                         this.hireEmployee(cand.type, cand.cost);
                     }
                });
            }
            return;
        }

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
        // Placeholder implementation
    }

    private hireEmployee(role: EmployeeRole, cost: number): void {
        const player = GameState.getInstance().player;
        if (player.money < cost) {
            console.log("Not enough money to hire!");
            return;
        }

        const spot = this.findFreeSpot();
        if (!spot) {
            console.log("No free space for new employee!");
            return;
        }

        player.spendMoney(cost);
        const name = role === EmployeeRole.Chef ? "Chef Luigi" : "Waiter Mario"; // Placeholder names
        const employee = new Employee(name, role, 1, 100);
        employee.gridX = spot.x;
        employee.gridY = spot.y;

        this.activeRestaurant.employees.push(employee);
        console.log(`Hired ${name} at ${spot.x}, ${spot.y}`);
    }

    private findFreeSpot(): { x: number, y: number } | null {
        // Try to find a random free spot first, or iterate
        // Simple iteration for now to guarantee finding one if it exists
        for (let y = 1; y < this.activeRestaurant.height - 1; y++) {
            for (let x = 1; x < this.activeRestaurant.width - 1; x++) {
                if (this.isSpotFree(x, y)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    private isSpotFree(x: number, y: number): boolean {
         const tile = this.activeRestaurant.getTile(x, y);
         if (!tile || tile.type === 'wall') return false;

         // Check furniture
         for (const item of this.activeRestaurant.furniture) {
             if (x >= item.gridX && x < item.gridX + item.width &&
                 y >= item.gridY && y < item.gridY + item.height) {
                 return false;
             }
         }

         // Check other employees
         for (const emp of this.activeRestaurant.employees) {
             if (emp.gridX === x && emp.gridY === y) return false;
         }

         return true;
    }
}
