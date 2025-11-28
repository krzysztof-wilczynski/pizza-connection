import { describe, it, expect, beforeEach } from 'vitest';
import { GameMap } from '../../src/model/Map';
import { TileType } from '../../src/model/enums';

describe('GameMap', () => {
    let map: GameMap;

    beforeEach(() => {
        map = new GameMap(15, 15);
    });

    it('should initialize with correct dimensions', () => {
        expect(map.rows).toBe(15);
        expect(map.cols).toBe(15);
    });

    it('should generate map with expected tile types', () => {
        // Based on logic in Map.ts
        // Row 7 is Road
        expect(map.getTile(7, 0)?.type).toBe(TileType.Road);
        expect(map.getTile(7, 14)?.type).toBe(TileType.Road);

        // Row 6 and 8 are Pavement
        expect(map.getTile(6, 0)?.type).toBe(TileType.Pavement);
        expect(map.getTile(8, 0)?.type).toBe(TileType.Pavement);

        // Row 0 should be Grass (default initialization)
        expect(map.getTile(0, 0)?.type).toBe(TileType.Grass);
    });

    it('should place player plot at specific location', () => {
        // Code says: Row 5, Col 7
        const tile = map.getTile(5, 7);
        expect(tile).toBeDefined();
        expect(tile?.type).toBe(TileType.BuildingForSale);
        expect(tile?.price).toBe(100);
    });

    it('should place expensive competitor plots', () => {
        // Corner 1: (1, 1)
        const corner1 = map.getTile(1, 1);
        expect(corner1?.type).toBe(TileType.BuildingForSale);
        expect(corner1?.price).toBe(5000);

        // Corner 2: (9, 9)
        const corner2 = map.getTile(9, 9);
        expect(corner2?.type).toBe(TileType.BuildingForSale);
        expect(corner2?.price).toBe(5000);
    });

    it('should return undefined for out of bounds access', () => {
        expect(map.getTile(-1, 0)).toBeUndefined();
        expect(map.getTile(0, -1)).toBeUndefined();
        expect(map.getTile(15, 0)).toBeUndefined();
        expect(map.getTile(0, 15)).toBeUndefined();
    });

    it('should allow purchasing a building', () => {
        const row = 5;
        const col = 7;
        const restaurantId = 'my-restaurant-id';

        // Verify initial state
        expect(map.getTile(row, col)?.type).toBe(TileType.BuildingForSale);

        map.purchaseBuilding(row, col, restaurantId);

        const tile = map.getTile(row, col);
        expect(tile?.type).toBe(TileType.BuildingOwned);
        expect(tile?.restaurantId).toBe(restaurantId);
    });

    it('should not allow purchasing a non-sale tile', () => {
        const row = 0; // Grass
        const col = 0;
        const restaurantId = 'id';

        map.purchaseBuilding(row, col, restaurantId);

        expect(map.getTile(row, col)?.type).toBe(TileType.Grass);
    });
});
