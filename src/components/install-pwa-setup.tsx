'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect platform
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false;

  // Check PWA standalone mode (works on all platforms)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check iOS standalone
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Check Android TWA/standalone
  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
};

export default function InstallPWASetup() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);

  useEffect(() => {
    // Check if already installed
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
      // iOS always shows manual instructions
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      if (!dismissed) {
        setShowPrompt(true);
      }
    } else if (isAndroid()) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user previously dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }

      console.log('PWA install prompt available');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-ios');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Android/Desktop with native prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setIsInstalled(true);
          toast({
            title: 'App installed!',
            description: 'BRAIN KIT has been added to your home screen.',
          });
        } else {
          console.log('User dismissed the install prompt');
          toast({
            title: 'Installation cancelled',
            description: 'You can install the app later from the menu.',
          });
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (platform === 'ios') {
      localStorage.setItem('pwa-install-dismissed-ios', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if already installed or user dismissed
  if (isInstalled || !showPrompt) {
    return null;
  }

  // iOS Manual Instructions
  if (platform === 'ios') {
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
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Install App (iOS)</CardTitle>
          </div>
          <CardDescription className="space-y-2 text-left">
            <p>To install BRAIN KIT on your iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Tap the <strong>Share</strong> button (square with arrow)</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> in the top right corner</li>
            </ol>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            className="w-full"
          >
            Got it
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Android/Desktop with native prompt
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
          <Download className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Install App</CardTitle>
        </div>
        <CardDescription>
          Install BRAIN KIT to your home screen for a better experience with faster loading and offline access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleInstallClick}
          className="w-full"
          disabled={!deferredPrompt}
        >
          {deferredPrompt ? 'Install to Home Screen' : 'Install via Browser Menu'}
        </Button>
        {!deferredPrompt && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Use your browser's menu to install this app
          </p>
        )}
      </CardContent>
    </Card>
  );
}
