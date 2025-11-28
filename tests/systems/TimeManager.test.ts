import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeManager } from '../../src/systems/TimeManager';

describe('TimeManager', () => {
    // Since TimeManager is a Singleton, we need to be careful with state between tests.
    // However, the class doesn't expose a reset method.
    // We can try to manually reset fields if they are public or use `vi` to mock internal state if needed.
    // Or we just accept the state persists or create a new way to reset it.
    // Looking at the code: constructor is private. Instance is static.

    // IMPORTANT: Because other tests might have used TimeManager, the state is unpredictable.
    // We should try to reset it.

    beforeEach(() => {
        const tm = TimeManager.getInstance();
        tm.day = 1;
        tm.hour = 8;
        tm.minute = 0;
        // Reset private accumulator if possible, or just ignore small drifts.
        // We can cast to any to reset private fields if needed for robust testing.
        (tm as any).timeAccumulator = 0;
    });

    it('should return the same instance', () => {
        const tm1 = TimeManager.getInstance();
        const tm2 = TimeManager.getInstance();
        expect(tm1).toBe(tm2);
    });

    it('should initialize with default start time (after reset)', () => {
        const tm = TimeManager.getInstance();
        expect(tm.day).toBe(1);
        expect(tm.hour).toBe(8);
        expect(tm.minute).toBe(0);
    });

    it('should advance time when update is called', () => {
        const tm = TimeManager.getInstance();
        // REAL_SEC_TO_GAME_MIN = 1. So 1000ms = 1 minute.

        tm.update(1000);
        expect(tm.minute).toBe(1);
        expect(tm.hour).toBe(8);

        tm.update(500); // 0.5 sec, not enough for a minute
        expect(tm.minute).toBe(1);

        tm.update(500); // +0.5 sec -> 1.0 sec total -> +1 minute
        expect(tm.minute).toBe(2);
    });

    it('should rollover hour correctly', () => {
        const tm = TimeManager.getInstance();
        tm.minute = 59;
        tm.hour = 8;

        tm.update(1000); // +1 minute

        expect(tm.minute).toBe(0);
        expect(tm.hour).toBe(9);
    });

    it('should rollover day correctly', () => {
        const tm = TimeManager.getInstance();
        tm.hour = 23;
        tm.minute = 59;
        tm.day = 1;

        tm.update(1000); // +1 minute

        expect(tm.minute).toBe(0);
        expect(tm.hour).toBe(0);
        expect(tm.day).toBe(2);
    });

    it('should correctly identify shop open hours', () => {
        const tm = TimeManager.getInstance();
        // START_HOUR = 10, END_HOUR = 22

        tm.hour = 9;
        expect(tm.isShopOpen()).toBe(false);

        tm.hour = 10;
        expect(tm.isShopOpen()).toBe(true);

        tm.hour = 21;
        expect(tm.isShopOpen()).toBe(true);

        tm.hour = 22;
        expect(tm.isShopOpen()).toBe(false);
    });

    it('should correctly identify day and night', () => {
        const tm = TimeManager.getInstance();
        // Day: 6 to 20 (exclusive of 20?)
        // Code: hour >= 6 && hour < 20

        tm.hour = 5;
        expect(tm.isDay()).toBe(false);
        expect(tm.isNight()).toBe(true);

        tm.hour = 6;
        expect(tm.isDay()).toBe(true);
        expect(tm.isNight()).toBe(false);

        tm.hour = 19;
        expect(tm.isDay()).toBe(true);

        tm.hour = 20;
        expect(tm.isDay()).toBe(false);
        expect(tm.isNight()).toBe(true);
    });

    it('should format time string correctly', () => {
        const tm = TimeManager.getInstance();
        tm.hour = 9;
        tm.minute = 5;
        expect(tm.getTimeString()).toBe('09:05');

        tm.hour = 14;
        tm.minute = 30;
        expect(tm.getTimeString()).toBe('14:30');
    });

    it('should return correct day of week', () => {
        const tm = TimeManager.getInstance();
        // Days array: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        // (day - 1) % 7

        tm.day = 1;
        expect(tm.getDayOfWeek()).toBe('Monday');

        tm.day = 2;
        expect(tm.getDayOfWeek()).toBe('Tuesday');

        tm.day = 8;
        expect(tm.getDayOfWeek()).toBe('Monday');
    });
});
