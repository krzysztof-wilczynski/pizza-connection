import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InteriorView } from '../../src/views/InteriorView';
import { Restaurant } from '../../src/model/Restaurant';
import { PizzaCreator } from '../../src/views/PizzaCreator';
import { AssetManager } from '../../src/systems/AssetManager';
import { GameState } from '../../src/model/GameState';
import { Furniture } from '../../src/model/Furniture';
import { TileType } from '../../src/model/enums';

// Mocks
class MockCanvasRenderingContext2D {
  canvas = { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  clearRect = vi.fn();
  fillRect = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  translate = vi.fn();
  drawImage = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  fill = vi.fn();
  stroke = vi.fn();
  fillText = vi.fn();
  measureText = vi.fn(() => ({ width: 10 }));
  strokeText = vi.fn();
}

describe('InteriorView Floating Text', () => {
  let interiorView: InteriorView;
  let mockCtx: any;
  let mockRestaurant: any;
  let mockPizzaCreator: any;
  let mockAssetManager: any;

  beforeEach(() => {
    mockCtx = new MockCanvasRenderingContext2D();
    mockRestaurant = {
      update: vi.fn(),
      furniture: [],
      employees: [],
      customers: [],
      menu: [],
      addFurniture: vi.fn(() => true),
      hasIngredientsFor: vi.fn(() => true),
      kitchenQueue: [],
      getCost: vi.fn(),
      buyIngredient: vi.fn(),
    } as unknown as Restaurant;

    mockPizzaCreator = {
      render: vi.fn(),
      active: false,
    } as unknown as PizzaCreator;

    mockAssetManager = {
      getAsset: vi.fn(),
    } as unknown as AssetManager;

    // Reset singleton for fresh state
    const gameState = GameState.getInstance();
    gameState.player.addMoney(1000000); // Ensure enough money

    interiorView = new InteriorView(
      mockCtx as CanvasRenderingContext2D,
      mockRestaurant,
      mockPizzaCreator,
      mockAssetManager
    );
  });

  it('should add a floating text via addFloatingText', () => {
    // Access private property for testing using 'any' cast
    interiorView.addFloatingText(100, 100, "Test", "red");

    const texts = (interiorView as any).floatingTexts;
    expect(texts.length).toBe(1);
    expect(texts[0].text).toBe("Test");
    expect(texts[0].lifeTime).toBeGreaterThan(0);
  });

  it('should update floating texts (move and decrease lifetime)', () => {
    interiorView.addFloatingText(100, 100, "Test", "red");
    const texts = (interiorView as any).floatingTexts;
    const initialY = texts[0].y;
    const initialLife = texts[0].lifeTime;

    interiorView.update(0.1); // 100ms

    expect(texts[0].y).toBeLessThan(initialY); // Moved up
    expect(texts[0].lifeTime).toBeLessThan(initialLife); // Aged
  });

  it('should remove dead floating texts', () => {
    interiorView.addFloatingText(100, 100, "Test", "red");
    const texts = (interiorView as any).floatingTexts;

    // Fast forward to death
    interiorView.update(100);

    expect(texts.length).toBe(0);
  });

  it('should trigger floating text on furniture purchase (POC)', () => {
    // Setup selected furniture
    const furniture: Furniture = {
        id: 'table',
        name: 'Table',
        price: 50,
        width: 1,
        height: 1,
        type: 'table',
        assetKey: 'furniture_table',
        color: 'brown',
        level: 1
    };
    (interiorView as any).selectedFurniture = furniture;

    // Simulate click in valid area
    const event = {
        clientX: 400, // roughly center
        clientY: 300,
        button: 0
    } as MouseEvent;

    // Mock screenToGrid to return valid coordinates
    // We can't easily mock imports, so we rely on the fact that click at center is likely valid valid
    // or we just trust the integration.
    // Instead, let's spy on addFloatingText
    const spy = vi.spyOn(interiorView, 'addFloatingText');

    // We need to ensure addFurniture returns true
    mockRestaurant.addFurniture.mockReturnValue(true);

    interiorView.handleMouseClick(event, vi.fn());

    expect(spy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), "-$50", "red");
  });
});
