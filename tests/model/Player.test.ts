import { describe, it, expect } from 'vitest';
import { Player } from '../../src/model/Player';

describe('Player', () => {
  it('should start with the correct amount of money', () => {
    const player = new Player(1000);
    expect(player.money).toBe(1000);
  });

  it('should add money correctly', () => {
    const player = new Player(1000);
    player.addMoney(500);
    expect(player.money).toBe(1500);
  });

  it('should not add a negative amount of money', () => {
    const player = new Player(1000);
    player.addMoney(-500);
    expect(player.money).toBe(1000);
  });

  it('should spend money correctly', () => {
    const player = new Player(1000);
    const success = player.spendMoney(500);
    expect(player.money).toBe(500);
    expect(success).toBe(true);
  });

  it('should not spend more money than available', () => {
    const player = new Player(1000);
    const success = player.spendMoney(1500);
    expect(player.money).toBe(1000);
    expect(success).toBe(false);
  });

  it('should not spend a negative amount of money', () => {
    const player = new Player(1000);
    const success = player.spendMoney(-500);
    expect(player.money).toBe(1000);
    expect(success).toBe(false);
  });
});
