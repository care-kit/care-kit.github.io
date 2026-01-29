import { useEffect, useState } from 'react';
import { NotificationService } from '@/services/notificationService';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(NotificationService.isSupported());

    // Check current permission status
    if (NotificationService.isSupported()) {
      NotificationService.checkPermissions().then(setHasPermission);
    }

    // Register action listeners
    NotificationService.registerActionListeners(() => {
      // Handle notification tap - navigate to affirmation page or refresh
      console.log('User tapped notification');
    });

    // Cleanup listeners on unmount
    return () => {
      NotificationService.removeAllListeners();
    };
  }, []);

  const requestPermission = async () => {
    const granted = await NotificationService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  const scheduleNotifications = async () => {
    await NotificationService.scheduleDailyAffirmationNotifications();
  };

  const cancelNotifications = async () => {
    await NotificationService.cancelAllNotifications();
  };

  return {
    isSupported,
    hasPermission,
    requestPermission,
    scheduleNotifications,
    cancelNotifications,
  };
}
