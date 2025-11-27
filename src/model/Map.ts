// src/model/Map.ts
import { TileType } from './enums';
import { Tile } from './Tile';

export class GameMap {
    private grid: Tile[][];
    public readonly rows: number;
    public readonly cols: number;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.grid = this.generateMap();
    }

    private generateMap(): Tile[][] {
        const map: Tile[][] = [];
        const basePrice = 200000; // Adjusted for more reasonable pricing
        for (let r = 0; r < this.rows; r++) {
            map[r] = [];
            for (let c = 0; c < this.cols; c++) {
                // Simple logic for roads and pavements for now
                if (r % 4 === 0 || c % 4 === 0) {
                    map[r][c] = { type: TileType.Road };
                } else if (Math.random() < 0.2) {
                    // Add some price variation (+/- 20%)
                    const price = basePrice * (0.8 + Math.random() * 0.4);
                    map[r][c] = { type: TileType.BuildingForSale, price: Math.round(price / 1000) * 1000 };
                } else {
                    map[r][c] = { type: TileType.Pavement };
                }
            }
        }
        return map;
    }

    public getTile(row: number, col: number): Tile | undefined {
        return this.grid[row]?.[col];
    }

    // A method to simulate buying a building and updating the tile
    public purchaseBuilding(row: number, col: number, restaurantId: string): void {
        const tile = this.getTile(row, col);
        if (tile && tile.type === TileType.BuildingForSale) {
            this.grid[row][col] = {
                type: TileType.BuildingOwned,
                restaurantId: restaurantId,
            };
        }
    }
}
