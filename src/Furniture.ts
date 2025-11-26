export interface Furniture {
    id: number;
    name: string;
    width: number; // in grid units
    height: number; // in grid units
    color: string;
    // sprite?: string; // Optional: for when we add actual graphics
}

export interface PlacedFurniture extends Furniture {
    gridX: number;
    gridY: number;
}
