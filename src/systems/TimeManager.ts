export class TimeManager {
  private gameTime: Date;
  private timeScale: number = 60; // 1 real second = 60 game seconds (1 minute)

  constructor() {
    this.gameTime = new Date();
    // Set a fixed start time, e.g., 8:00 AM
    this.gameTime.setHours(8, 0, 0, 0);
  }

  public update(deltaTime: number): void {
    // deltaTime is in milliseconds
    // realSeconds = deltaTime / 1000
    // gameSeconds = realSeconds * timeScale
    const addedMilliseconds = deltaTime * this.timeScale;
    this.gameTime = new Date(this.gameTime.getTime() + addedMilliseconds);
  }

  public getFormattedTime(): string {
    return this.gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  public getFormattedDate(): string {
    return this.gameTime.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  }

  public getDayOfWeek(): string {
    return this.gameTime.toLocaleDateString([], { weekday: 'long' });
  }

  // Helper for raw access if needed
  public getDate(): Date {
    return new Date(this.gameTime);
  }
}
