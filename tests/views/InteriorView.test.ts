import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InteriorView } from '../../src/views/InteriorView';
import { Restaurant } from '../../src/model/Restaurant';
import { PizzaCreator } from '../../src/views/PizzaCreator';
import { AssetManager } from '../../src/systems/AssetManager';
import { TimeManager } from '../../src/systems/TimeManager';
import { GameState } from '../../src/model/GameState';

// Mock dependencies
const mockCtx = {
  canvas: { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }) },
  clearRect: vi.fn(),
  fillStyle: '',
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
} as unknown as CanvasRenderingContext2D;

const mockAssetManager = {
  getAsset: vi.fn(),
  loadAsset: vi.fn(),
} as unknown as AssetManager;

const mockPizzaCreator = {
  active: false,
  render: vi.fn(),
  handleMouseMove: vi.fn(),
  handleMouseClick: vi.fn(),
  open: vi.fn(),
  onSave: vi.fn(),
} as unknown as PizzaCreator;

describe('InteriorView', () => {
  let view: InteriorView;
  let restaurant: Restaurant;

  beforeEach(() => {
    vi.clearAllMocks();
    restaurant = new Restaurant();
    // Ensure GameState has a player
    // Use setMoney for testing/restoration
    // @ts-ignore - setMoney might be internal or specific
    if (typeof GameState.getInstance().player.setMoney === 'function') {
        GameState.getInstance().player.setMoney(1000);
    } else {
        // Fallback: reset to 0 then add
        const current = GameState.getInstance().player.money;
        GameState.getInstance().player.spendMoney(current);
        GameState.getInstance().player.addMoney(1000);
    }

    // Reset TimeManager
    const tm = TimeManager.getInstance();
    tm.hour = 10;
    tm.minute = 30;

    view = new InteriorView(mockCtx, restaurant, mockPizzaCreator, mockAssetManager);
  });

  it('should render UI buttons and HUD', () => {
    view.render();

    // Check if HUD buttons are drawn (checking fillText for button labels)
    expect(mockCtx.fillText).toHaveBeenCalledWith("Kreator Pizzy", expect.any(Number), expect.any(Number));
    expect(mockCtx.fillText).toHaveBeenCalledWith("Menu", expect.any(Number), expect.any(Number));
    expect(mockCtx.fillText).toHaveBeenCalledWith("Miasto", expect.any(Number), expect.any(Number));

    // Check time display
    const timeStr = "10:30"; // Formatted time
    // We expect the formatted string in the HUD
    // Since calls might be combined (date + time), checking loose match or specific calls
    // In code: `${dateText}, ${timeText}`
    const dateText = TimeManager.getInstance().getFormattedDate();
    const expectedTimeStr = `${dateText}, ${timeStr}`;
    expect(mockCtx.fillText).toHaveBeenCalledWith(expectedTimeStr, expect.any(Number), expect.any(Number));
  });

  it('should update restaurant simulation', () => {
    const spy = vi.spyOn(restaurant, 'update');
    view.update(0.1);
    expect(spy).toHaveBeenCalledWith(0.1);
  });

  it('should handle "Miasto" button click', () => {
    const callback = vi.fn();
    // Button is at right side: width - 150 (approx)
    // Canvas 800. Btn City: x = 800 - 140 - 10 = 650. Y = 10. W = 140. H = 40.
    // Click at 700, 20
    const event = {
      clientX: 700,
      clientY: 20,
      button: 0,
    } as MouseEvent;

    view.handleMouseClick(event, callback);
    expect(callback).toHaveBeenCalledWith(null);
  });

  it('should handle "Creator" button click', () => {
    const callback = vi.fn();
    // Creator btn: x=10, y=10, w=120, h=40
    const event = {
      clientX: 50,
      clientY: 20,
      button: 0,
    } as MouseEvent;

    view.handleMouseClick(event, callback);
    expect(mockPizzaCreator.open).toHaveBeenCalled();
  });
});
