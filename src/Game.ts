import { BUILDING_HEIGHT, gridToScreen, isPointInPolygon, Point, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { GameMap, TileType } from './Map';
import { gridToScreen, screenToGrid, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { GameMap, Tile, TileType } from './Map';
import { Player } from './Player';
import { BUILDING_HEIGHT, gridToScreen, isPointInPolygon, Point, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from './Isometric';
import { GameMap, TileType } from './Map';
import { UIManager } from './UIManager';
import { GameState } from './model/GameState';
import { Restaurant } from './model/Restaurant';
import { v4 as uuidv4 } from 'uuid';
import { loadInitialData } from './model/initialData';
import { Furniture, PlacedFurniture } from './Furniture';

export enum GameState {
    City,
    Interior,
}

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
import { GameState } from './model/GameState';
import { Restaurant } from './model/Restaurant';
import { v4 as uuidv4 } from 'uuid';
import { loadInitialData } from './model/initialData';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private map: GameMap;
    private gameState: GameState;
    private cameraOffset = { x: 0, y: 0 };
    private uiManager: UIManager;

    private currentState: GameState = GameState.City;
    private activeBuilding: Tile | null = null;
    private placedFurniture: PlacedFurniture[] = [];
    private selectedFurniture: Furniture | null = null;
    private mousePosition = { x: 0, y: 0 };

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("2D context not available");
        }
        this.ctx = context;
        this.map = new GameMap(10, 10);
        this.gameState = GameState.getInstance();
        loadInitialData(this.gameState, this.map);
        this.uiManager = new UIManager();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());


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

        switch (this.currentState) {
            case GameState.City:
                this.updateCity(deltaTime);
                this.renderCity();
                break;
            case GameState.Interior:
                this.updateInterior(deltaTime);
                this.renderInterior();
                break;
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private updateCity(deltaTime: number): void {
        // Game logic will go here
    }

    private renderCity(): void {
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

    private updateInterior(deltaTime: number): void {
        // TODO: Interior update logic
    }

    private renderInterior(): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#6B4F35'; // Brown floor color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const interiorOffsetX = this.canvas.width / 2;
        const interiorOffsetY = this.canvas.height / 4;

        this.ctx.save();
        this.ctx.translate(interiorOffsetX, interiorOffsetY);

        // Draw 10x10 grid
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const screenPos = gridToScreen(col, row);
                this.drawTile(screenPos.x, screenPos.y);
            }
        }

        // Draw placed furniture
        this.placedFurniture.forEach(f => {
            this.drawFurniture(f.gridX, f.gridY, f);
        });

        // Draw furniture ghost if an item is selected
        this.drawFurnitureGhost(interiorOffsetX, interiorOffsetY);

        this.ctx.restore();

        this.drawBackButton();
        this.drawFurniturePanel();
    }

    private drawFurniturePanel(): void {
        const panelX = this.canvas.width - FURNITURE_PANEL_WIDTH;
        const panelY = 0;

        // Draw panel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX, panelY, FURNITURE_PANEL_WIDTH, this.canvas.height);

        // Draw available furniture items
        AVAILABLE_FURNITURE.forEach((item, index) => {
            const itemY = panelY + (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * index + FURNITURE_ITEM_MARGIN;

            // Draw item background
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(panelX + FURNITURE_ITEM_MARGIN, itemY, FURNITURE_PANEL_WIDTH - 2 * FURNITURE_ITEM_MARGIN, FURNITURE_ITEM_HEIGHT);

            // Draw item preview (a small colored square)
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(panelX + FURNITURE_ITEM_MARGIN * 2, itemY + FURNITURE_ITEM_MARGIN, 40, 40);

            // Draw item name
            this.ctx.fillStyle = 'white';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.name, panelX + FURNITURE_ITEM_MARGIN * 3 + 40, itemY + FURNITURE_ITEM_HEIGHT / 2);
        });
    }

    private drawFurnitureGhost(interiorOffsetX: number, interiorOffsetY: number): void {
        if (!this.selectedFurniture) {
            return;
        }

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

        // Draw button background
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x, y, BACK_BUTTON_WIDTH, BACK_BUTTON_HEIGHT);

        // Draw button text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Powrót do Miasta', x + BACK_BUTTON_WIDTH / 2, y + BACK_BUTTON_HEIGHT / 2);
    }

    private drawFurniture(x: number, y: number, furniture: Furniture, isValid: boolean = true): void {
        const screenPos = gridToScreen(x, y);

        // Simple rectangular representation for now
        const tileWidth = TILE_WIDTH_HALF * 2;
        const tileHeight = TILE_HEIGHT_HALF * 2;

        this.ctx.globalAlpha = isValid ? 1.0 : 0.5; // Make invalid ghosts semi-transparent
        this.ctx.fillStyle = isValid ? furniture.color : 'red';

        // This is a simplified drawing logic. A real implementation would handle isometric shapes.
        // For MVP, we draw a flat rectangle covering the tiles.
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
        switch (this.currentState) {
            case GameState.City:
                this.handleCityMouseClick(event);
                break;
            case GameState.Interior:
                this.handleInteriorMouseClick(event);
                break;
        }
    }

    private handleCityMouseClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const clickPoint: Point = {
            x: event.clientX - rect.left - this.cameraOffset.x,
            y: event.clientY - rect.top - this.cameraOffset.y,
        };

        const gridPos = screenToGrid(screenX, screenY);
        const col = Math.floor(gridPos.x);
        const row = Math.floor(gridPos.y);

        if (row >= 0 && row < this.map.rows && col >= 0 && col < this.map.cols) {
            const tile = this.map.getTile(row, col);
            if (tile && tile.type === TileType.BuildingForSale && tile.price) {
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
                        console.log(`Player bought property at (${row}, ${col}) for $${tile.price}. Remaining money: $${this.gameState.playerMoney}`);
                        console.log('New restaurant created:', newRestaurant);
                    } else {
                        alert("Not enough money!");
                    }
                });
            } else if (tile && tile.type === TileType.BuildingOwned) {
                const restaurant = this.gameState.restaurants.find(r => r.id === tile.restaurantId);
                if (restaurant) {
                    console.log('Clicked on owned restaurant:', restaurant);
                    alert(`Restaurant Details:\nID: ${restaurant.id}\nLocation: (${restaurant.location.row}, ${restaurant.location.col})`);
                }
        const gridPos = screenToGrid(screenX, screenY);
        const col = Math.floor(gridPos.x);
        const row = Math.floor(gridPos.y);

        if (row >= 0 && row < this.map.rows && col >= 0 && col < this.map.cols) {
            const tile = this.map.getTile(row, col);
            if (tile && tile.type === TileType.BuildingForSale && tile.price) {
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
                        console.log(`Player bought property at (${row}, ${col}) for $${tile.price}. Remaining money: $${this.gameState.playerMoney}`);
                        console.log('New restaurant created:', newRestaurant);
                    } else {
                        alert("Not enough money!");
                    }
                });
            } else if (tile && tile.type === TileType.BuildingOwned) {
                const restaurant = this.gameState.restaurants.find(r => r.id === tile.restaurantId);
                if (restaurant) {
                    console.log('Clicked on owned restaurant:', restaurant);
                    alert(`Restaurant Details:\nID: ${restaurant.id}\nLocation: (${restaurant.location.row}, ${restaurant.location.col})`);
                }
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
                        console.log(`Player bought property at (${row}, ${col}) for $${tile.price}. Remaining money: $${this.gameState.playerMoney}`);
                        console.log('New restaurant created:', newRestaurant);
                    } else {
                        alert("Not enough money!");
                    }
                });
            } else if (tile && tile.type === TileType.BuildingOwned) {
                const restaurant = this.gameState.restaurants.find(r => r.id === tile.restaurantId);
                if (restaurant) {
                    console.log('Clicked on owned restaurant:', restaurant);
                    alert(`Restaurant Details:\nID: ${restaurant.id}\nLocation: (${restaurant.location.row}, ${restaurant.location.col})`);
                }
            }
        }
            if (tile) {
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
                } else if (tile.type === TileType.BuildingOwned) {
                    this.activeBuilding = tile;
                    this.currentState = GameState.Interior;
                    console.log(`Entering building at (${row}, ${col})`);
                }
            }
        }
    }

    private handleInteriorMouseClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const buttonX = BACK_BUTTON_MARGIN;
        const buttonY = BACK_BUTTON_MARGIN;

        // Check if the back button was clicked
        if (
            clickX >= buttonX &&
            clickX <= buttonX + BACK_BUTTON_WIDTH &&
            clickY >= buttonY &&
            clickY <= buttonY + BACK_BUTTON_HEIGHT
        ) {
            this.currentState = GameState.City;
            this.activeBuilding = null;
            this.placedFurniture = [];
            this.selectedFurniture = null;
            console.log("Returning to city view.");
            return;
        }

        // Check if a furniture item from the panel was clicked
        const panelX = this.canvas.width - FURNITURE_PANEL_WIDTH;
        if (clickX >= panelX) {
            for (let i = 0; i < AVAILABLE_FURNITURE.length; i++) {
                const item = AVAILABLE_FURNITURE[i];
                const itemY = (FURNITURE_ITEM_HEIGHT + FURNITURE_ITEM_MARGIN) * i + FURNITURE_ITEM_MARGIN;
                if (
                    clickY >= itemY &&
                    clickY <= itemY + FURNITURE_ITEM_HEIGHT
                ) {
                    this.selectedFurniture = { ...item }; // Create a copy
                    console.log(`Selected furniture: ${this.selectedFurniture.name}`);
                    return;
                }
            }
        }

        // If we are in "placing furniture" mode
        if (this.selectedFurniture) {
             // Right click to cancel placing
            if (event.button === 2) {
                this.selectedFurniture = null;
                console.log("Furniture placement cancelled.");
                return;
            }

            const interiorOffsetX = this.canvas.width / 2;
            const interiorOffsetY = this.canvas.height / 4;
            const screenX = this.mousePosition.x - interiorOffsetX;
            const screenY = this.mousePosition.y - interiorOffsetY;
            const gridPos = screenToGrid(screenX, screenY);
            const gridX = Math.floor(gridPos.x);
            const gridY = Math.floor(gridPos.y);

            if (this.isPositionValid(gridX, gridY, this.selectedFurniture)) {
                const newFurniture: PlacedFurniture = {
                    ...this.selectedFurniture,
                    gridX,
                    gridY,
                };
                this.placedFurniture.push(newFurniture);
                console.log(`Placed ${newFurniture.name} at (${gridX}, ${gridY})`);
                this.selectedFurniture = null; // Exit placement mode
            } else {
                console.log("Cannot place furniture here.");
                // Optionally, provide visual feedback like a screen shake or a sound
            }
            return;
        }
    }

    private isPositionValid(gridX: number, gridY: number, furniture: Furniture): boolean {
        // Check bounds
        if (gridX < 0 || gridY < 0 || gridX + furniture.width > 10 || gridY + furniture.height > 10) {
            return false;
        }

        // Check for collisions with other furniture
        for (const placed of this.placedFurniture) {
            if (
                gridX < placed.gridX + placed.width &&
                gridX + furniture.width > placed.gridX &&
                gridY < placed.gridY + placed.height &&
                gridY + furniture.height > placed.gridY
            ) {
                return false; // Collision detected
            }
        }

        return true;
    }

    private handleMouseMove(event: MouseEvent): void {
        if (this.currentState !== GameState.Interior) {
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
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
