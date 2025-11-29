import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Restaurant } from '../../src/model/Restaurant';
import { GameState } from '../../src/model/GameState';
import { WallType } from '../../src/model/enums';
import { CONSTRUCTION_COSTS } from '../../src/data/ConstructionCosts';
import { PersistenceManager } from '../../src/systems/PersistenceManager';

describe('Architecture & Economy', () => {
  let restaurant: Restaurant;
  let gameState: GameState;

  beforeEach(() => {
    // Reset GameState for each test
    // We can't easily destroy the singleton, but we can reset its properties
    gameState = GameState.getInstance();
    gameState.restaurants = [];
    gameState.player.setMoney(1000); // Start with plenty of cash

    // Create a fresh restaurant
    restaurant = new Restaurant();
    gameState.restaurants.push(restaurant);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should successfully place a wall when player has funds', () => {
    const startMoney = gameState.player.money;
    const x = 5;
    const y = 5;
    const cost = CONSTRUCTION_COSTS.WALL;

    // Verify initial state
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.None);

    // Action
    const result = restaurant.placeWall(x, y, WallType.Brick);

    // Assertions
    expect(result).toBe(true);
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.Brick);
    expect(restaurant.getTile(x, y)?.isWalkable).toBe(false);
    expect(gameState.player.money).toBe(startMoney - cost);
  });

  it('should fail to place a wall when player has insufficient funds', () => {
    const x = 5;
    const y = 5;

    // Set money to be less than wall cost
    gameState.player.setMoney(CONSTRUCTION_COSTS.WALL - 1);
    const startMoney = gameState.player.money;

    // Action
    const result = restaurant.placeWall(x, y, WallType.Brick);

    // Assertions
    expect(result).toBe(false);
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.None); // Should remain None
    expect(gameState.player.money).toBe(startMoney); // Money should not change
  });

  it('should only allow placing a door on an existing wall', () => {
    const x = 5;
    const y = 5;

    // 1. Try placing door on empty space -> Should Fail
    const result1 = restaurant.placeDoor(x, y);
    expect(result1).toBe(false);
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.None);

    // 2. Place a wall first
    restaurant.placeWall(x, y, WallType.Brick);
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.Brick);
    expect(restaurant.getTile(x, y)?.isWalkable).toBe(false);

    // 3. Try placing door on wall -> Should Success
    const result2 = restaurant.placeDoor(x, y);
    expect(result2).toBe(true);
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.Door);
    expect(restaurant.getTile(x, y)?.isWalkable).toBe(true);
  });

  it('should handle demolition logic and costs', () => {
    const x = 6;
    const y = 6;
    // Build wall first
    restaurant.placeWall(x, y, WallType.Drywall);

    const moneyBeforeDemolish = gameState.player.money;

    // Demolish
    const result = restaurant.removeStructure(x, y);

    expect(result).toBe(true);
    expect(restaurant.getTile(x, y)?.wallType).toBe(WallType.None);
    expect(restaurant.getTile(x, y)?.isWalkable).toBe(true);
    expect(gameState.player.money).toBe(moneyBeforeDemolish - CONSTRUCTION_COSTS.DEMOLISH);
  });

  it('should persist the grid layout correctly', () => {
    const x = 2;
    const y = 2;

    // 1. Setup specific state
    restaurant.placeWall(x, y, WallType.Brick);
    const moneySaved = gameState.player.money;

    // 2. Save
    const pm = PersistenceManager.getInstance();
    pm.saveGame();

    // 3. WIPE STATE (Simulate reload)
    // We manually clear the singleton's list or create a "fresh" load
    gameState.restaurants = [];
    // We can't easily replace the singleton instance, but loadGame re-populates it.

    // 4. Load
    const loadSuccess = pm.loadGame();
    expect(loadSuccess).toBe(true);

    // 5. Verify
    const loadedRestaurant = gameState.restaurants[0];
    expect(loadedRestaurant).toBeDefined();

    const tile = loadedRestaurant.getTile(x, y);
    expect(tile?.wallType).toBe(WallType.Brick);
    expect(tile?.isWalkable).toBe(false);
    expect(gameState.player.money).toBe(moneySaved);
  });
});
