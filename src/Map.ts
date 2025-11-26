// src/Map.ts

export enum TileType {
    Empty,
    BuildingForSale,
    BuildingOwned,
}

export interface Tile {
    type: TileType;
    price?: number;
    restaurantId?: string;
}

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
        const basePrice = 2000000;
        for (let r = 0; r < this.rows; r++) {
            map[r] = [];
            for (let c = 0; c < this.cols; c++) {
                if (Math.random() < 0.2) {
                    // Add some price variation (+/- 20%)
                    const price = basePrice * (0.8 + Math.random() * 0.4);
                    map[r][c] = { type: TileType.BuildingForSale, price: Math.round(price / 1000) * 1000 };
                } else {
                    map[r][c] = { type: TileType.Empty };
                }
            }
        }
        return map;
    }

    public getTile(row: number, col: number): Tile | undefined {
        return this.grid[row]?.[col];
    }
}
