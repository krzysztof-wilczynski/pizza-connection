import {AssetManager} from '../systems/AssetManager';
import {ASSETS_MANIFEST} from '../systems/AssetsManifest';
import {GameMap} from '../model/Map';
import {PizzaCreator} from '../views/PizzaCreator';
import {UIManager} from '../views/UIManager';
import {GameState} from '../model/GameState';
import {loadInitialData} from '../data/initialData';
import {GameView, TileType} from '../model/enums';
import {Tile, BuildingOwnedTile} from '../model/Tile';
import {CityView} from '../views/CityView';
import {InteriorView} from '../views/InteriorView';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private map: GameMap;
  private gameState: GameState;
  private cameraOffset = {x: 0, y: 0};
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
    const loadPromises = Object.entries(ASSETS_MANIFEST).map(([key, path]) => {
            return this.assetManager.loadAsset(key, path);
        });

        await Promise.all(loadPromises);
        console.log('All assets loaded from manifest.');
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

    this.gameState.timeManager.update(deltaTime);

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
    const changeViewCallback = (newView: Tile | null) => {
      if (this.currentView === GameView.City && newView) {
        if (newView.type === TileType.BuildingOwned) {
          const ownedTile = newView as BuildingOwnedTile;
          const restaurant = this.gameState.restaurants.find(r => r.id === ownedTile.restaurantId);

          if (restaurant) {
            this.activeBuilding = newView;
            this.interiorView = new InteriorView(this.ctx, restaurant, this.pizzaCreator, this.assetManager);
            this.currentView = GameView.Interior;
          }
        }
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
