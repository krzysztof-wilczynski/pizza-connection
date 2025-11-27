import { gridToScreen, screenToGrid, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { Furniture } from './model/Furniture';
import { FURNITURE_CATALOG } from './model/FurnitureCatalog';
import { PizzaCreator } from './PizzaCreator';
import { Restaurant } from './model/Restaurant';
import { AssetManager } from './AssetManager';
import { GameState } from './model/GameState';

const BACK_BUTTON_WIDTH = 180;
const BACK_BUTTON_HEIGHT = 50;
const BACK_BUTTON_MARGIN = 20;

const FURNITURE_PANEL_WIDTH = 250;
const FURNITURE_ITEM_HEIGHT = 60;
const FURNITURE_ITEM_MARGIN = 10;

export class InteriorView {
    private ctx: CanvasRenderingContext2D;
    private activeRestaurant: Restaurant;
    private pizzaCreator: PizzaCreator;
    private assetManager: AssetManager;

    private selectedFurniture: Furniture | null = null;
    private mousePosition = { x: 0, y: 0 };

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

        this.activeRestaurant.furniture.forEach(f => {
            this.drawFurniture(f.gridX, f.gridY, f);
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
        this.drawFurniturePanel();
    }

    private drawFurniturePanel(): void {
        const panelX = this.ctx.canvas.width - FURNITURE_PANEL_WIDTH;
        const panelY = 0;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX, panelY, FURNITURE_PANEL_WIDTH, this.ctx.canvas.height);

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
            FURNITURE_CATALOG.forEach((item, i) => {
                const itemY = (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * i + FURNITURE_ITEM_MARGIN;
                if (clickY >= itemY && clickY <= itemY + FURNITURE_ITEM_HEIGHT) {
                    this.selectedFurniture = { ...item };
                }
            });
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
}
