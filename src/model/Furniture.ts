// src/model/Furniture.ts

export interface Furniture {
  id: number;
  name: string;
  width: number; // in grid units
  height: number; // in grid units
  color: string;
  assetKey: string;
  price: number;
  type: 'kitchen' | 'dining' | 'decoration';
  stats: {
    capacity?: number;
    cookingSpeed?: number;
    appeal?: number;
  };
  rotation?: number; // 0, 1, 2, 3 (kroki co 90 stopni) <--- ZMIANA
}

export interface PlacedFurniture extends Furniture {
  gridX: number;
  gridY: number;
}