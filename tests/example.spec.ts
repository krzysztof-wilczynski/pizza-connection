import { test, expect } from '@playwright/test';

const TILE_WIDTH_HALF = 64;
const TILE_HEIGHT_HALF = 32;

function gridToScreen(col: number, row: number): { x: number; y: number } {
  const x = (col - row) * TILE_WIDTH_HALF;
  const y = (col + row) * TILE_HEIGHT_HALF;
  return { x, y };
}

test.describe('Pizza Connection Clone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game canvas', async ({ page }) => {
    // given
    const canvas = page.locator('canvas');

    // then
    await expect(canvas).toBeVisible();
  });


});
