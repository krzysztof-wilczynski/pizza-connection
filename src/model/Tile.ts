import { TileType, WallType, ZoneType } from './enums';

export interface InteriorTile {
  x: number;
  y: number;
  isWalkable: boolean;
  wallType: WallType;
  zone: ZoneType;
  floorAsset: string;
}

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

export interface GrassTile extends BaseTile {
  type: TileType.Grass;
}

export type Tile =
  | EmptyTile
  | BuildingForSaleTile
  | BuildingOwnedTile
  | RoadTile
  | PavementTile
  | GrassTile;


