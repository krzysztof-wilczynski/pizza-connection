import { describe, it, expect, vi } from 'vitest';
import { InventoryPanel } from '../../../src/views/ui/InventoryPanel';
import { Restaurant } from '../../../src/model/Restaurant';
import { GameState } from '../../../src/model/GameState';

describe('InventoryPanel', () => {
  it('should handle buy click correctly', () => {
    const restaurant = new Restaurant();
    const panel = new InventoryPanel(800, 600);

    // Mock GameState player money
    const player = GameState.getInstance().player;
    player.spendMoney = vi.fn().mockReturnValue(true);

    // Click coordinates relative to where we expect the button to be
    // Panel X = 800 - 250 = 550
    // Panel Y = 40
    // First item Y = 40 + 10 = 50
    // Button Y roughly 50 + 35 = 85
    // Button X = 550 + 10 = 560

    panel.handleClick(570, 90, restaurant);

    expect(player.spendMoney).toHaveBeenCalled();
    expect(restaurant.inventory.get('tomato_sauce')).toBe(5); // Assuming tomato_sauce is first
  });
});
