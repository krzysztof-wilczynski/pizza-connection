export class NotificationManager {
  private static instance: NotificationManager;
  private container: HTMLElement | null = null;

  private constructor() {
    this.container = document.getElementById('notification-area');
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public log(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    if (!this.container) {
      this.container = document.getElementById('notification-area');
      if (!this.container) {
        console.warn('NotificationManager: #notification-area not found in DOM');
        return;
      }
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to DOM
    this.container.appendChild(notification);

    // Auto-remove after 3 seconds (plus animation time)
    setTimeout(() => {
        notification.classList.add('fade-out');
        // Wait for CSS transition to finish before removing
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 500); // 0.5s fade out
    }, 3000);
  }
}
