// src/model/Map.ts
import { TileType } from './enums';
import { Tile } from './Tile';

export class GameMap {
    private grid: Tile[][];
    public readonly rows: number;
    public readonly cols: number;

    constructor(rows: number = 15, cols: number = 15) {
        this.rows = rows;
        this.cols = cols;
        this.grid = this.generateMap();
    }

    private generateMap(): Tile[][] {
        const map: Tile[][] = [];

        // 1. Initialize with Grass
        for (let r = 0; r < this.rows; r++) {
            map[r] = [];
            for (let c = 0; c < this.cols; c++) {
                map[r][c] = { type: TileType.Grass };
            }
        }

        // 2. Draw Main Road (Horizontal in the middle) - Row 7
        const roadRow = 7;
        for (let c = 0; c < this.cols; c++) {
            map[roadRow][c] = { type: TileType.Road };
        }

        // 3. Draw Sidewalks - Rows 6 and 8
        for (let c = 0; c < this.cols; c++) {
            map[roadRow - 1][c] = { type: TileType.Pavement };
            map[roadRow + 1][c] = { type: TileType.Pavement };
        }

        // 4. Place Player's Plot (Center, cheap)
        // Placing it at Row 5, Col 7 (facing the pavement at Row 6)
        const playerPlotRow = 5;
        const playerPlotCol = 7;
        map[playerPlotRow][playerPlotCol] = {
            type: TileType.BuildingForSale,
            price: 100
        };

        // 5. Place Competitors (Corners, expensive)
        // Corner 1: Top-Left area (but slightly in to avoid edge clipping if any)
        map[1][1] = {
            type: TileType.BuildingForSale,
            price: 5000
        };

        // Corner 2: Bottom-Right area
        map[9][9] = {
            type: TileType.BuildingForSale,
            price: 5000
        };

        // 6. Add Decorative Buildings (Background)
        // Add a few owned buildings without IDs to serve as decoration
        const decoCoords = [
            { r: 5, c: 3 },
            { r: 5, c: 11 },
            { r: 9, c: 2 },
            { r: 9, c: 7 }, // Opposite player
            { r: 9, c: 12 }
        ];

        for (const coord of decoCoords) {
            map[coord.r][coord.c] = {
                type: TileType.BuildingOwned,
                restaurantId: "" // Decorative
            };
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
