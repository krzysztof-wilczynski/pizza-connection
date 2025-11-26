// src/CityView.ts
import { GameMap } from './Map';
import { GameState } from './model/GameState';
import { gridToScreen, isPointInPolygon, Point, TILE_WIDTH_HALF, TILE_HEIGHT_HALF, BUILDING_HEIGHT } from './Isometric';
import { TileType } from './model/enums';
import { UIManager } from './UIManager';
import { Restaurant } from './model/Restaurant';
import { v4 as uuidv4 } from 'uuid';
import { Tile } from './model/Tile';
import { PizzaCreator } from './PizzaCreator';

export class CityView {
    private ctx: CanvasRenderingContext2D;
    private map: GameMap;
    private gameState: GameState;
    private cameraOffset: { x: number, y: number };
    private uiManager: UIManager;
    private pizzaCreator: PizzaCreator;

    constructor(
        ctx: CanvasRenderingContext2D,
        map: GameMap,
        gameState: GameState,
        cameraOffset: { x: number, y: number },
        uiManager: UIManager,
        pizzaCreator: PizzaCreator
    ) {
        this.ctx = ctx;
        this.map = map;
        this.gameState = gameState;
        this.cameraOffset = cameraOffset;
        this.uiManager = uiManager;
        this.pizzaCreator = pizzaCreator;
    }

    public update(deltaTime: number): void {
        // City-specific update logic will go here
    }

    public render(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.cameraOffset.x, this.cameraOffset.y);

        for (let row = 0; row < this.map.rows; row++) {
            for (let col = 0; col < this.map.cols; col++) {
                const tile = this.map.getTile(row, col);
                if (tile) {
                    const screenPos = gridToScreen(col, row);
                    if (tile.type === TileType.BuildingForSale) {
                        this.drawBuilding(screenPos.x, screenPos.y, '#a8a8a8');
                    } else if (tile.type === TileType.BuildingOwned) {
                        this.drawBuilding(screenPos.x, screenPos.y, '#4CAF50');
                    } else {
                        this.drawTile(screenPos.x, screenPos.y);
                    }
                }
            }
        }

        this.ctx.restore();
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

    private drawBuilding(x: number, y: number, color: string): void {
        const topY = y - BUILDING_HEIGHT;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x + TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.lineTo(x, topY + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x - TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#868686';
        this.ctx.beginPath();
        this.ctx.moveTo(x - TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.lineTo(x, topY + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x, y + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x - TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#c4c4c4';
        this.ctx.beginPath();
        this.ctx.moveTo(x + TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.lineTo(x, topY + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x, y + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x + TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    public handleMouseClick(event: MouseEvent, changeView: (newView: any) => void): void {
        if (this.pizzaCreator.active) {
            this.pizzaCreator.handleMouseClick(event);
            return;
        }

        const rect = this.ctx.canvas.getBoundingClientRect();
        const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

        if (mousePos.x > 10 && mousePos.x < 210 && mousePos.y > 10 && mousePos.y < 60) {
            this.pizzaCreator.open();
            return;
        }

        const clickPoint: Point = {
            x: event.clientX - rect.left - this.cameraOffset.x,
            y: event.clientY - rect.top - this.cameraOffset.y,
        };

        for (let row = this.map.rows - 1; row >= 0; row--) {
            for (let col = this.map.cols - 1; col >= 0; col--) {
                const tile = this.map.getTile(row, col);

                if (tile && (tile.type === TileType.BuildingForSale || tile.type === TileType.BuildingOwned)) {
                    const screenPos = gridToScreen(col, row);
                    const topY = screenPos.y - BUILDING_HEIGHT;

                    const topFace: Point[] = [
                        { x: screenPos.x, y: topY },
                        { x: screenPos.x + TILE_WIDTH_HALF, y: topY + TILE_HEIGHT_HALF },
                        { x: screenPos.x, y: topY + TILE_HEIGHT_HALF * 2 },
                        { x: screenPos.x - TILE_WIDTH_HALF, y: topY + TILE_HEIGHT_HALF },
                    ];

                    if (isPointInPolygon(clickPoint, topFace)) {
                        if (tile.type === TileType.BuildingForSale && tile.price) {
                            this.uiManager.showPurchasePanel(tile.price, () => {
                                if (this.gameState.playerMoney >= tile.price!) {
                                    this.gameState.playerMoney -= tile.price!;
                                    tile.type = TileType.BuildingOwned;

                                    const newRestaurant: Restaurant = {
                                        id: uuidv4(),
                                        location: { row, col },
                                        furniture: [],
                                        menu: [],
                                        employees: [],
                                        stats: { reputation: 10, dailyIncome: 0 }
                                    };

                                    this.gameState.addRestaurant(newRestaurant);
                                    tile.restaurantId = newRestaurant.id;

                                    this.uiManager.hidePurchasePanel();
                                } else {
                                    alert("Not enough money!");
                                }
                            });
                        } else if (tile.type === TileType.BuildingOwned) {
                            changeView(tile);
                        }
                        return;
                    }
                }
            }
        }
    }
}
