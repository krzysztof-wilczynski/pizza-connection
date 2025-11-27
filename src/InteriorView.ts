// src/InteriorView.ts
import { gridToScreen, screenToGrid, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { Furniture, PlacedFurniture } from './model/Furniture';
import { PizzaCreator } from './PizzaCreator';
import { Tile } from './model/Tile';

const BACK_BUTTON_WIDTH = 180;
const BACK_BUTTON_HEIGHT = 50;
const BACK_BUTTON_MARGIN = 20;

const FURNITURE_PANEL_WIDTH = 250;
const FURNITURE_ITEM_HEIGHT = 60;
const FURNITURE_ITEM_MARGIN = 10;

const AVAILABLE_FURNITURE: Furniture[] = [
    { id: 1, name: 'Stolik', width: 2, height: 1, color: '#8B4513' },
    { id: 2, name: 'Piec', width: 2, height: 2, color: '#2F4F4F' },
    { id: 3, name: 'Lada', width: 3, height: 1, color: '#A0522D' },
];

export class InteriorView {
    private ctx: CanvasRenderingContext2D;
    private activeBuilding: Tile;
    private pizzaCreator: PizzaCreator;

    private placedFurniture: PlacedFurniture[] = [];
    private selectedFurniture: Furniture | null = null;
    private mousePosition = { x: 0, y: 0 };

    constructor(ctx: CanvasRenderingContext2D, activeBuilding: Tile, pizzaCreator: PizzaCreator) {
        this.ctx = ctx;
        this.activeBuilding = activeBuilding;
        this.pizzaCreator = pizzaCreator;
        this.showUI();
    }

    public showUI(): void {
        const interiorUI = document.getElementById('interior-ui');
        if (interiorUI) {
            interiorUI.style.display = 'block';
        }
    }

    public hideUI(): void {
        const interiorUI = document.getElementById('interior-ui');
        if (interiorUI) {
            interiorUI.style.display = 'none';
        }
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

        this.placedFurniture.forEach(f => {
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

        AVAILABLE_FURNITURE.forEach((item, index) => {
            const itemY = panelY + (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * index + FURNITURE_ITEM_MARGIN;
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(panelX + FURNITURE_ITEM_MARGIN, itemY, FURNITURE_PANEL_WIDTH - 2 * FURNITURE_ITEM_MARGIN, FURNITURE_ITEM_HEIGHT);
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(panelX + FURNITURE_ITEM_MARGIN * 2, itemY + FURNITURE_ITEM_MARGIN, 40, 40);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.name, panelX + FURNITURE_ITEM_MARGIN * 3 + 40, itemY + FURNITURE_ITEM_HEIGHT / 2);
        });
    }

    private drawFurnitureGhost(interiorOffsetX: number, interiorOffsetY: number): void {
        if (!this.selectedFurniture) return;

        const screenX = this.mousePosition.x - interiorOffsetX;
        const screenY = this.mousePosition.y - interiorOffsetY;
        const gridPos = screenToGrid(screenX, screenY);
        const gridX = Math.floor(gridPos.x);
        const gridY = Math.floor(gridPos.y);
        const isValid = this.isPositionValid(gridX, gridY, this.selectedFurniture);
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
        this.ctx.globalAlpha = isValid ? 1.0 : 0.5;
        this.ctx.fillStyle = isValid ? furniture.color : 'red';
        for (let row = 0; row < furniture.height; row++) {
            for (let col = 0; col < furniture.width; col++) {
                const tileScreenPos = gridToScreen(x + col, y + row);
                this.ctx.beginPath();
                this.ctx.moveTo(tileScreenPos.x, tileScreenPos.y);
                this.ctx.lineTo(tileScreenPos.x + TILE_WIDTH_HALF, tileScreenPos.y + TILE_HEIGHT_HALF);
                this.ctx.lineTo(tileScreenPos.x, tileScreenPos.y + TILE_HEIGHT_HALF * 2);
                this.ctx.lineTo(tileScreenPos.x - TILE_WIDTH_HALF, tileScreenPos.y + TILE_HEIGHT_HALF);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    private drawTile(x: number, y: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
        this.ctx.lineTo(x, y + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x - TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
        this.ctx.closePath();
        this.ctx.strokeStyle = '#555';
        this.ctx.stroke();
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
            AVAILABLE_FURNITURE.forEach((item, i) => {
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

            if (this.isPositionValid(gridX, gridY, this.selectedFurniture)) {
                this.placedFurniture.push({ ...this.selectedFurniture, gridX, gridY });
                this.selectedFurniture = null;
            }
        }
    }

    private isPositionValid(gridX: number, gridY: number, furniture: Furniture): boolean {
        if (gridX < 0 || gridY < 0 || gridX + furniture.width > 10 || gridY + furniture.height > 10) {
            return false;
        }
        for (const placed of this.placedFurniture) {
            if (gridX < placed.gridX + placed.width && gridX + furniture.width > placed.gridX &&
                gridY < placed.gridY + placed.height && gridY + furniture.height > placed.gridY) {
                return false;
            }
        }
        return true;
    }
}
