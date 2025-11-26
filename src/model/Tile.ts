import { TileType } from './enums';

interface BaseTile {
  type: TileType;
}

export interface EmptyTile extends BaseTile {
  type: TileType.Empty;
}

export interface BuildingForSaleTile extends BaseTile {
  type: TileType.BuildingForSale;
  price: number;
}

export interface BuildingOwnedTile extends BaseTile {
  type: TileType.BuildingOwned;
  restaurantId: string;
}

export interface RoadTile extends BaseTile {
  type: TileType.Road;
}

export interface PavementTile extends BaseTile {
  type: TileType.Pavement;
}

export type Tile =
  | EmptyTile
  | BuildingForSaleTile
  | BuildingOwnedTile
  | RoadTile
  | PavementTile;
