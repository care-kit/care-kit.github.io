'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermission, saveFCMTokenToUser, listenForMessages } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied' | 'default'>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check current notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentStatus = Notification.permission;
      setNotificationStatus(currentStatus);

      // Show prompt if not granted and not dismissed
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      if (currentStatus === 'default' && !dismissed) {
        setShowPrompt(true);
      }

      // If already granted, set up FCM token
      if (currentStatus === 'granted' && user) {
        setupNotifications();
      }
    }
  }, [user]);

  const setupNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();

      if (token) {
        await saveFCMTokenToUser(user.uid, token);
        setNotificationStatus('granted');
        localStorage.removeItem('notification-prompt-dismissed');

        toast({
          title: 'Notifications enabled!',
          description: 'You will receive reminders for your daily affirmations.',
        });

        // Listen for foreground messages
        listenForMessages((payload) => {
          console.log('Received notification:', payload);
          toast({
            title: payload.notification?.title || 'Notification',
            description: payload.notification?.body || '',
          });
        });
      } else {
        setNotificationStatus('denied');
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings to receive reminders.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to set up notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    await setupNotifications();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Don't show if already granted or if user dismissed and status is not denied
  if (notificationStatus === 'granted' || (!showPrompt && notificationStatus !== 'denied')) {
    return null;
  }

  // Don't show if notifications aren't supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return (
    <Card className="mb-4 border-primary/50 bg-primary/5">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Enable Notifications</CardTitle>
        </div>
        <CardDescription>
          Stay on track with your daily affirmations. We'll send you gentle reminders morning and evening.
          {notificationStatus === 'denied' && (
            <span className="block mt-2 text-destructive font-medium">
              Notifications are currently blocked. Please enable them in your browser settings.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleEnableNotifications}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Setting up...' : notificationStatus === 'denied' ? 'Open Browser Settings' : 'Enable Notifications'}
        </Button>
      </CardContent>
    </Card>
  );
}
