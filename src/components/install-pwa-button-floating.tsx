'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function InstallPWAButtonFloating() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'other' | null>(null);

  useEffect(() => {
    // Check if already installed
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
      setShowButton(true); // Always show on iOS
    } else {
      setPlatform('other');
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowButton(true);
      console.log('PWA install prompt available');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      // iOS - show instructions
      toast({
        title: 'Install on iOS',
        description: '1. Tap the Share button (⬆️)\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add"',
        duration: 10000,
      });
    } else if (deferredPrompt) {
      // Android/Desktop with native prompt
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
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    } else {
      // Fallback - browser doesn't support beforeinstallprompt
      toast({
        title: 'Install via browser menu',
        description: 'Use your browser\'s menu to install this app to your home screen.',
        duration: 5000,
      });
    }
  };

  // Don't show if already installed
  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleInstallClick}
            size="lg"
            className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 z-50"
            style={{
              bottom: 'max(1.5rem, calc(1.5rem + var(--safe-area-inset-bottom)))',
              right: 'max(1.5rem, calc(1.5rem + var(--safe-area-inset-right)))'
            }}
          >
            <Download className="h-6 w-6" />
            <span className="sr-only">Install App</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Install app to home screen</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
