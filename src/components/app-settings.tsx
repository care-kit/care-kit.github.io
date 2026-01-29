'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Bell, RefreshCw } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function AppSettings() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const resetInstallPrompt = () => {
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-dismissed-ios');
    toast({
      title: 'Install prompt reset',
      description: 'The app installation prompt will show again on your next visit.',
    });
    setIsResetting(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const resetNotificationPrompt = () => {
    localStorage.removeItem('notification-prompt-dismissed');
    toast({
      title: 'Notification prompt reset',
      description: 'The notification setup prompt will show again on your next visit.',
    });
    setIsResetting(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const resetAllPrompts = () => {
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-dismissed-ios');
    localStorage.removeItem('notification-prompt-dismissed');
    toast({
      title: 'All prompts reset',
      description: 'All setup prompts will show again on your next visit.',
    });
    setIsResetting(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-headline">App Settings</CardTitle>
        <CardDescription>
          Manage your app installation and notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">App Installation</p>
              <p className="text-xs text-muted-foreground">Reset install prompt</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetInstallPrompt}
            disabled={isResetting}
          >
            Reset
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">Reset notification prompt</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetNotificationPrompt}
            disabled={isResetting}
          >
            Reset
          </Button>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={resetAllPrompts}
            disabled={isResetting}
          >
            <RefreshCw className="h-4 w-4" />
            Reset All Prompts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
