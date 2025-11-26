// src/Isometric.ts

export const TILE_WIDTH_HALF = 64;
export const TILE_HEIGHT_HALF = 32;
export const BUILDING_HEIGHT = 64;

export interface Point {
    x: number;
    y: number;
}

export function gridToScreen(col: number, row: number): Point {
    const x = (col - row) * TILE_WIDTH_HALF;
    const y = (col + row) * TILE_HEIGHT_HALF;
    return { x, y };
}

export function screenToGrid(x: number, y: number): Point {
    const col = (x / TILE_WIDTH_HALF + y / TILE_HEIGHT_HALF) / 2;
    const row = (y / TILE_HEIGHT_HALF - x / TILE_WIDTH_HALF) / 2;
    return { x: col, y: row };
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}
