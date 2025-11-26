// src/model/Tile.ts
import { TileType } from './enums';

export interface Tile {
    type: TileType;
    price?: number;
    restaurantId?: string;
}
