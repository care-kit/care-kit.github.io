'use client';

import { useEffect } from 'react';
import { NotificationService } from '@/services/notificationService';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on native platforms
    if (!NotificationService.isSupported()) {
      return;
    }

    // Initialize notifications when app loads
    const initNotifications = async () => {
      try {
        // Check if we have permission
        const hasPermission = await NotificationService.checkPermissions();

        if (hasPermission) {
          // Schedule notifications if permission already granted
          await NotificationService.scheduleDailyAffirmationNotifications();
        } else {
          // Request permission on first launch
          const granted = await NotificationService.requestPermissions();
          if (granted) {
            await NotificationService.scheduleDailyAffirmationNotifications();
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initNotifications();

    // Register action listeners
    NotificationService.registerActionListeners(() => {
      // When user taps notification, could navigate to home or affirmation page
      console.log('User tapped notification - app opened');
    });

    // Cleanup on unmount
    return () => {
      NotificationService.removeAllListeners();
    };
  }, []);

  return <>{children}</>;
}
