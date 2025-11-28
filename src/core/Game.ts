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
import {HUD} from '../views/HUD';
import {TimeManager} from '../systems/TimeManager';
import {PersistenceManager} from '../systems/PersistenceManager';

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
  private hud: HUD;
  private timeManager: TimeManager;
  private persistenceManager: PersistenceManager;

  private currentView: GameView = GameView.City;
  private cityView: CityView;
  private interiorView: InteriorView | null = null;
  private activeBuilding: Tile | null = null;
  private timeSinceLastSave: number = 0;

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
    this.timeManager = TimeManager.getInstance();
    this.persistenceManager = PersistenceManager.getInstance();
    this.hud = new HUD(this.gameState, this.timeManager);

    // Try to load game, otherwise load initial data
    if (!this.persistenceManager.loadGame()) {
      console.log('No save found, starting new game.');
      loadInitialData(this.gameState, this.map);
    } else {
      console.log('Game loaded from save.');
      // Need to restore building ownership on the map based on loaded restaurants
      this.restoreMapOwnership();
    }

    this.uiManager = new UIManager();
    this.pizzaCreator = new PizzaCreator(this.assetManager);

    this.cityView = new CityView(this.ctx, this.map, this.gameState, this.cameraOffset, this.uiManager, this.pizzaCreator, this.assetManager);

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.cameraOffset.x = this.canvas.width / 2;
    this.cameraOffset.y = this.canvas.height / 4;

  }

  private restoreMapOwnership() {
      // Re-assign tiles to restaurants based on loaded IDs if needed.
      // Since map is static (re-generated on new GameMap), we need to find the tiles again.
      // This is tricky because the save doesn't store WHICH tiles were owned.
      // Assuming single player restaurant for now or simple "first available" logic
      // matching initialData logic but for loaded restaurants.

      // FIXME: Real implementation should save Map State (which tiles are owned).
      // For MVP/Current Scope, we will just give the restaurant the same starting spot
      // or assume the map logic handles it? No, map is fresh.

      // Let's try to find a spot for each restaurant.
      this.gameState.restaurants.forEach(restaurant => {
           let placed = false;
           // Naive restoration: just find a building for sale and give it back.
           // Ideally we save Tile ownership in GameState or Map.
           for (let r = 0; r < this.map.rows && !placed; r++) {
            for (let c = 0; c < this.map.cols && !placed; c++) {
              const tile = this.map.getTile(r, c);
              if (tile && tile.type === TileType.BuildingForSale) {
                  // In a real load, we should match exact coordinates.
                  // For now, we just re-assign the first one we find.
                  this.map.purchaseBuilding(r, c, restaurant.id);
                  placed = true;
              }
            }
          }
      });
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

    this.timeManager.update(deltaTime);
    this.hud.update(deltaTime);

    // Auto-Save Logic (Every 30 seconds)
    this.timeSinceLastSave += deltaTime;
    if (this.timeSinceLastSave > 30000) {
        this.timeSinceLastSave = 0;
        this.persistenceManager.saveGame();
    }

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

    // Always render HUD on top
    this.hud.render(this.ctx);

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
    if (this.pizzaCreator.active) {
      this.pizzaCreator.handleMouseDown(event);
    } else if (this.currentView === GameView.Interior) {
      this.interiorView?.handleMouseDown(event);
    }
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

  private handleWheel(event: WheelEvent): void {
    if (this.currentView === GameView.Interior && this.interiorView) {
      this.interiorView.handleWheel(event);
    }
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
