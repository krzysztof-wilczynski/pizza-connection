// src/Isometric.ts

export const TILE_WIDTH_HALF = 64;  // Half the width of a tile
export const TILE_HEIGHT_HALF = 32; // Half the height of a tile
export const BUILDING_HEIGHT = 64; // The visual height of the building cube

export interface Point {
    x: number;
    y: number;
}

/**
 * Converts grid coordinates (row, col) to screen coordinates (x, y).
 * @param col - The column in the grid.
 * @param row - The row in the grid.
 * @returns An object with x and y screen coordinates.
 */
export function gridToScreen(col: number, row: number): Point {
    const x = (col - row) * TILE_WIDTH_HALF;
    const y = (col + row) * TILE_HEIGHT_HALF;
    return { x, y };
}

/**
 * Checks if a point is inside a polygon using the ray-casting algorithm.
 * @param point - The point to check.
 * @param polygon - An array of points defining the polygon vertices in order.
 * @returns True if the point is inside the polygon, false otherwise.
 */
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
