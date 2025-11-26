import { BUILDING_HEIGHT, gridToScreen, isPointInPolygon, Point, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { GameMap, TileType } from './Map';
import { Player } from './Player';
import { UIManager } from './UIManager';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private map: GameMap;
    private player: Player;
    private cameraOffset = { x: 0, y: 0 };
    private uiManager: UIManager;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("2D context not available");
        }
        this.ctx = context;
        this.map = new GameMap(10, 10);
        this.player = new Player(2500000); // Starting money
        this.uiManager = new UIManager();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', this.handleMouseClick.bind(this));

        // Center camera initially
        this.cameraOffset.x = this.canvas.width / 2;
        this.cameraOffset.y = this.canvas.height / 4;
    }

    private resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public start(): void {
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private gameLoop(timestamp: number): void {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private update(deltaTime: number): void {
        // Game logic will go here
    }

    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#333'; // Dark grey background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
                        this.drawBuilding(screenPos.x, screenPos.y, '#4CAF50'); // Green for owned
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

        // Draw top face
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x + TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.lineTo(x, topY + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x - TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();


        // Draw left face
        this.ctx.fillStyle = '#868686';
        this.ctx.beginPath();
        this.ctx.moveTo(x - TILE_WIDTH_HALF, topY + TILE_HEIGHT_HALF);
        this.ctx.lineTo(x, topY + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x, y + TILE_HEIGHT_HALF * 2);
        this.ctx.lineTo(x - TILE_WIDTH_HALF, y + TILE_HEIGHT_HALF);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw right face
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

    private handleMouseClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const clickPoint: Point = {
            x: event.clientX - rect.left - this.cameraOffset.x,
            y: event.clientY - rect.top - this.cameraOffset.y,
        };

        // Iterate from front to back to respect Z-order
        for (let row = this.map.rows - 1; row >= 0; row--) {
            for (let col = this.map.cols - 1; col >= 0; col--) {
                const tile = this.map.getTile(row, col);

                if (tile && (tile.type === TileType.BuildingForSale || tile.type === TileType.BuildingOwned)) {
                    const screenPos = gridToScreen(col, row);
                    const topY = screenPos.y - BUILDING_HEIGHT;

                    // Define polygons for the building's visible faces
                    const topFace: Point[] = [
                        { x: screenPos.x, y: topY },
                        { x: screenPos.x + TILE_WIDTH_HALF, y: topY + TILE_HEIGHT_HALF },
                        { x: screenPos.x, y: topY + TILE_HEIGHT_HALF * 2 },
                        { x: screenPos.x - TILE_WIDTH_HALF, y: topY + TILE_HEIGHT_HALF },
                    ];

                    const leftFace: Point[] = [
                        { x: screenPos.x - TILE_WIDTH_HALF, y: topY + TILE_HEIGHT_HALF },
                        { x: screenPos.x, y: topY + TILE_HEIGHT_HALF * 2 },
                        { x: screenPos.x, y: screenPos.y + TILE_HEIGHT_HALF * 2 },
                        { x: screenPos.x - TILE_WIDTH_HALF, y: screenPos.y + TILE_HEIGHT_HALF },
                    ];

                    const rightFace: Point[] = [
                        { x: screenPos.x + TILE_WIDTH_HALF, y: topY + TILE_HEIGHT_HALF },
                        { x: screenPos.x, y: topY + TILE_HEIGHT_HALF * 2 },
                        { x: screenPos.x, y: screenPos.y + TILE_HEIGHT_HALF * 2 },
                        { x: screenPos.x + TILE_WIDTH_HALF, y: screenPos.y + TILE_HEIGHT_HALF },
                    ];

                    if (isPointInPolygon(clickPoint, topFace) || isPointInPolygon(clickPoint, leftFace) || isPointInPolygon(clickPoint, rightFace)) {
                        if (tile.type === TileType.BuildingForSale && tile.price) {
                            this.uiManager.showPurchasePanel(tile.price, () => {
                                if (this.player.canAfford(tile.price!)) {
                                    this.player.spendMoney(tile.price!);
                                    tile.type = TileType.BuildingOwned;
                                    this.uiManager.hidePurchasePanel();
                                    console.log(`Player bought property at (${row}, ${col}) for $${tile.price}. Remaining money: $${this.player.getMoney()}`);
                                } else {
                                    alert("Not enough money!");
                                }
                            });
                        }
                        // If we found a clicked building, we can stop checking
                        return;
                    }
                }
            }
        }
    }
}
