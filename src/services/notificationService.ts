import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  private static MORNING_NOTIFICATION_ID = 1;
  private static EVENING_NOTIFICATION_ID = 2;

  /**
   * Check if notifications are supported on this platform
   */
  static isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Request notification permissions
   * @returns Promise<boolean> - true if permission granted
   */
  static async requestPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('Notifications not supported on web platform');
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check current notification permission status
   */
  static async checkPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule daily notifications at 9am and 6pm
   */
  static async scheduleDailyAffirmationNotifications(): Promise<void> {
    if (!this.isSupported()) {
      console.log('Notifications not supported on this platform');
      return;
    }

    try {
      // Check if we have permission
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('Notification permission not granted');
          return;
        }
      }

      // Cancel any existing notifications
      await this.cancelAllNotifications();

      // Get the next 9am and 6pm times
      const now = new Date();
      const morning = new Date();
      morning.setHours(9, 0, 0, 0);
      if (morning <= now) {
        morning.setDate(morning.getDate() + 1);
      }

      const evening = new Date();
      evening.setHours(18, 0, 0, 0);
      if (evening <= now) {
        evening.setDate(evening.getDate() + 1);
      }

      // Schedule the notifications
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.MORNING_NOTIFICATION_ID,
            title: 'Good Morning!',
            body: 'Your affirmation is ready',
            schedule: {
              at: morning,
              repeats: true,
              every: 'day',
            },
            sound: undefined,
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
          },
          {
            id: this.EVENING_NOTIFICATION_ID,
            title: 'Evening Reflection',
            body: 'Your affirmation is ready',
            schedule: {
              at: evening,
              repeats: true,
              every: 'day',
            },
            sound: undefined,
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
          },
        ],
      });

      console.log('Daily notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: this.MORNING_NOTIFICATION_ID },
          { id: this.EVENING_NOTIFICATION_ID },
        ],
      });
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  /**
   * Get list of pending notifications
   */
  static async getPendingNotifications() {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Register notification action listeners
   * Call this once when the app initializes
   */
  static registerActionListeners(onNotificationReceived?: () => void): void {
    if (!this.isSupported()) {
      return;
    }

    // Listen for when a notification is tapped
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notification action performed:', notification);
      if (onNotificationReceived) {
        onNotificationReceived();
      }
    });
  }

  /**
   * Remove all notification listeners
   */
  static removeAllListeners(): void {
    if (!this.isSupported()) {
      return;
    }

    LocalNotifications.removeAllListeners();
  }
}
