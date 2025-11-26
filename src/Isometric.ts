// src/Isometric.ts

export const TILE_WIDTH_HALF = 64;  // Half the width of a tile
export const TILE_HEIGHT_HALF = 32; // Half the height of a tile

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
 * Converts screen coordinates (x, y) to grid coordinates (row, col).
 * @param x - The x coordinate on the screen.
 * @param y - The y coordinate on the screen.
 * @returns An object with row and col grid coordinates.
 */
export function screenToGrid(x: number, y: number): Point {
    const row = (y / TILE_HEIGHT_HALF - x / TILE_WIDTH_HALF) / 2;
    const col = (x / TILE_WIDTH_HALF + y / TILE_HEIGHT_HALF) / 2;
    return { x: col, y: row };
}
