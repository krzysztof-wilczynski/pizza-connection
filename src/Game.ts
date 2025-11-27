import { AssetManager } from './AssetManager';
import { GameMap } from './Map';
import { PizzaCreator } from './PizzaCreator';
import { UIManager } from './UIManager';
import { GameState } from './model/GameState';
import { loadInitialData } from './model/initialData';
import { GameView } from './model/enums';
import { Tile } from './model/Tile';
import { CityView } from './CityView';
import { InteriorView } from './InteriorView';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private map: GameMap;
    private gameState: GameState;
    private cameraOffset = { x: 0, y: 0 };
    private uiManager: UIManager;
    private pizzaCreator: PizzaCreator;
    private assetManager: AssetManager;

    private currentView: GameView = GameView.City;
    private cityView: CityView;
    private interiorView: InteriorView | null = null;
    private activeBuilding: Tile | null = null;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("2D context not available");
        }
        this.ctx = context;
        this.map = new GameMap(10, 10);
        this.gameState = GameState.getInstance();
        this.assetManager = new AssetManager();
        loadInitialData(this.gameState, this.map);
        this.uiManager = new UIManager();
        this.pizzaCreator = new PizzaCreator();

        this.cityView = new CityView(this.ctx, this.map, this.gameState, this.cameraOffset, this.uiManager, this.pizzaCreator, this.assetManager);

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        this.cameraOffset.x = this.canvas.width / 2;
        this.cameraOffset.y = this.canvas.height / 4;

    }

    public async preloadAssets(): Promise<void> {
        const assetsToLoad = [
            { key: 'floor', path: '/assets/restaurant/floor.svg' },
            { key: 'wall_left', path: '/assets/restaurant/walls/left_wall.svg' },
            { key: 'wall_right', path: '/assets/restaurant/walls/right_wall.svg' },
            { key: 'wall_back', path: '/assets/restaurant/walls/back_wall.svg' },
            { key: 'oven', path: '/assets/restaurant/kitchen/oven.svg' },
            { key: 'table', path: '/assets/restaurant/interior/table.svg' },
            { key: 'chair', path: '/assets/restaurant/interior/chair.svg' },
            { key: 'pizza_base', path: '/assets/pizza/ciasto.svg' },
            { key: 'building_sale', path: '/assets/city/residential/house.svg' },
            { key: 'building_owned', path: '/assets/city/commercial/restaurant.svg' },
        ];

        await Promise.all(assetsToLoad.map(asset => this.assetManager.loadAsset(asset.key, asset.path)));
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

        switch (this.currentView) {
            case GameView.City:
                this.cityView.update(deltaTime);
                this.cityView.render();
                break;
            case GameView.Interior:
                this.interiorView?.update(deltaTime);
                this.interiorView?.render();
                break;
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (this.pizzaCreator.active) {
            if (event.key === 'Escape') {
                this.pizzaCreator.close();
            } else {
                this.pizzaCreator.handleKeyDown(event);
            }
        }
    }

    private handleMouseDown(event: MouseEvent): void {
        if (this.pizzaCreator.active) this.pizzaCreator.handleMouseDown(event);
    }

    private handleMouseMove(event: MouseEvent): void {
        if (this.pizzaCreator.active) {
            this.pizzaCreator.handleMouseMove(event);
        } else if (this.currentView === GameView.Interior) {
            this.interiorView?.handleMouseMove(event);
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        if (this.pizzaCreator.active) this.pizzaCreator.handleMouseUp(event);
    }

    private handleMouseClick(event: MouseEvent): void {
        const changeViewCallback = (newView: any) => {
            if (this.currentView === GameView.City) {
                this.activeBuilding = newView;
                this.interiorView = new InteriorView(this.ctx, this.activeBuilding!, this.pizzaCreator, this.assetManager);
                this.currentView = GameView.Interior;
            } else {
                this.interiorView?.hideUI();
                this.currentView = GameView.City;
                this.interiorView = null;
                this.activeBuilding = null;
            }
        };

        if (this.currentView === GameView.City) {
            this.cityView.handleMouseClick(event, changeViewCallback);
        } else {
            this.interiorView?.handleMouseClick(event, changeViewCallback);
        }
    }
}
