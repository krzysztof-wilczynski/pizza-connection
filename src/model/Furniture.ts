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
    // sprite?: string; // Optional: for when we add actual graphics
}

export interface PlacedFurniture extends Furniture {
    gridX: number;
    gridY: number;
}
