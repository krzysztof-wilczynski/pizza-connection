export class TimeManager {
  private static instance: TimeManager;

  // Time constants
  public static readonly REAL_SEC_TO_GAME_MIN = 1; // 1 real second = 1 game minute
  public static readonly START_HOUR = 10;
  public static readonly END_HOUR = 22;

  // Time state
  public day: number = 1;
  public hour: number = 8; // Start at 8:00 AM
  public minute: number = 0;
  private timeAccumulator: number = 0;

  private constructor() {}

  public static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }

  public update(deltaTimeMs: number): void {
    // deltaTime is in milliseconds
    const deltaTimeSec = deltaTimeMs / 1000;
    this.timeAccumulator += deltaTimeSec;

    while (this.timeAccumulator >= TimeManager.REAL_SEC_TO_GAME_MIN) {
      this.timeAccumulator -= TimeManager.REAL_SEC_TO_GAME_MIN;
      this.advanceMinute();
    }
  }

  private advanceMinute(): void {
    this.minute++;
    if (this.minute >= 60) {
      this.minute = 0;
      this.hour++;
      if (this.hour >= 24) {
        this.hour = 0;
        this.day++;
      }
    }
  }

  public isShopOpen(): boolean {
    return this.hour >= TimeManager.START_HOUR && this.hour < TimeManager.END_HOUR;
  }

  public isDay(): boolean {
    return this.hour >= 6 && this.hour < 20;
  }

  public isNight(): boolean {
    return !this.isDay();
  }

  public getTimeString(): string {
    const h = this.hour.toString().padStart(2, '0');
    const m = this.minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
