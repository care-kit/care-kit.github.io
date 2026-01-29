'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from '@/components/icons';

type Platform = 'ios' | 'android' | 'other' | null;

interface InstallGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InstallGuideDialog({ open, onOpenChange }: InstallGuideDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('other');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setDetectedPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setDetectedPlatform('android');
      } else {
        setDetectedPlatform('other');
      }
    }
  }, []);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  const handleBack = () => {
    setSelectedPlatform(null);
  };

  const renderPlatformSelection = () => (
    <>
      <DialogHeader>
        <div className="flex justify-center mb-4">
          <Download className="h-12 w-12 text-foreground" />
        </div>
        <DialogTitle className="text-center">Install Care Kit</DialogTitle>
        <DialogDescription className="text-center">
          Select your device type to see installation instructions.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 mt-4">
        <Button
          onClick={() => handlePlatformSelect('ios')}
          variant="outline"
          size="sm"
          className="w-full border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40"
        >
          iOS
        </Button>
        <Button
          onClick={() => handlePlatformSelect('android')}
          variant="outline"
          size="sm"
          className="w-full border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40"
        >
          Android
        </Button>
        <Button
          onClick={() => handlePlatformSelect('other')}
          variant="outline"
          size="sm"
          className="w-full border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40"
        >
          Other
        </Button>
      </div>
    </>
  );

  const renderManualInstructions = () => (
    <>
      <DialogHeader>
        <div className="flex justify-center mb-4">
          <Download className="h-12 w-12 text-foreground" />
        </div>
        <DialogTitle className="text-center">Installation Instructions</DialogTitle>
        <DialogDescription>
          {selectedPlatform === 'ios' && (
            <div className="text-left space-y-2 mt-4">
              <p className="font-medium">On iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
                <li>Tap the <strong>Share</strong> button (square with arrow up)</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> in the top right corner</li>
              </ol>
            </div>
          )}
          {selectedPlatform === 'android' && (
            <div className="text-left space-y-2 mt-4">
              <p className="font-medium">On Android:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
                <li>Tap the <strong>three dots</strong> menu (⋮)</li>
                <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong></li>
                <li>Tap <strong>Add</strong> or <strong>Install</strong></li>
              </ol>
            </div>
          )}
          {selectedPlatform === 'other' && (
            <div className="text-left space-y-2 mt-4">
              <p className="text-sm">Use your browser's menu to install this app to your desktop or device.</p>
              <p className="text-sm text-muted-foreground">Look for an install or add to home screen option in your browser's settings menu.</p>
            </div>
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 mt-4">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="w-full border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40"
        >
          ← Back to Platform Selection
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          size="sm"
          className="w-full"
        >
          Got it
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {selectedPlatform === null ? renderPlatformSelection() : renderManualInstructions()}
      </DialogContent>
    </Dialog>
  );
}
