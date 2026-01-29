'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermission, saveFCMTokenToUser, listenForMessages } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NotificationToggle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check current notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);

      // If already granted, set up listener
      if (Notification.permission === 'granted') {
        listenForMessages((payload) => {
          console.log('Received notification:', payload);
          toast({
            title: payload.notification?.title || 'Notification',
            description: payload.notification?.body || '',
          });
        });
      }
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!user) return;

    if (notificationStatus === 'granted') {
      // Can't programmatically disable - show instruction
      toast({
        title: 'Notifications are enabled',
        description: 'To disable, go to your browser settings → Site Settings → Notifications',
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();

      if (token) {
        await saveFCMTokenToUser(user.uid, token);
        setNotificationStatus('granted');

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
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if notifications aren't supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  const isEnabled = notificationStatus === 'granted';
  const isDenied = notificationStatus === 'denied';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isEnabled ? 'default' : 'outline'}
            size="icon"
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className={isDenied ? 'opacity-50' : ''}
          >
            {isEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isEnabled ? 'Notifications enabled' : 'Enable notifications'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isEnabled
              ? 'Notifications are enabled'
              : isDenied
              ? 'Notifications blocked - check browser settings'
              : 'Click to enable notifications'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
