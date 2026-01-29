'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, LogOut, Sunrise, Sunset, Lock, Shield, Install } from '@/components/icons';
import StressRating from '@/components/stress-rating';
import AffirmationCard from '@/components/affirmation-card';
import { affirmations } from '@/lib/affirmations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { saveStressData, type StressDataRecord } from '@/services/stress-data-service';
import { useToast } from '@/hooks/use-toast';
import { getAffirmationIndex, getStudyDay, hasCompletedSevenDays } from '@/lib/study-day';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import NotificationToggle from '@/components/notification-toggle';
import InstallPWAButtonFloating from '@/components/install-pwa-button-floating';
import InstallGuideDialog from '@/components/install-guide-dialog';

import { z } from "zod"; // Import z if not already imported

type FlowState = 'idle' | 'pre-stress' | 'affirmation' | 'post-stress' | 'complete';
type StressData = { pre: number | null; post: number | null };

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [stressData, setStressData] = useState<StressData>({ pre: null, post: null });
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const [affirmationType, setAffirmationType] = useState<'morning' | 'evening' | null>(null);
  const [currentHour, setCurrentHour] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [studyDay, setStudyDay] = useState<number | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const isAdmin = useIsAdmin();

  // Time tracking state
  const [flowStartTime, setFlowStartTime] = useState<Date | null>(null);
  const [affirmationStartTime, setAffirmationStartTime] = useState<Date | null>(null);
  const [affirmationEndTime, setAffirmationEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, router]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing redirect to login');
        router.push('/login');
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);

  useEffect(() => {
    setIsClient(true);
    setCurrentHour(new Date().getHours());

    // Calculate study day if user has studyStartDate
    if (user?.studyStartDate) {
      const currentStudyDay = getStudyDay(user.studyStartDate);
      setStudyDay(currentStudyDay);

      // Check if user has completed 7 days and update flag if needed
      if (!user.hasCompletedStudy && hasCompletedSevenDays(user.studyStartDate)) {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, {
          hasCompletedStudy: true,
        }).catch((error) => {
          console.error('Error updating hasCompletedStudy flag:', error);
        });
      }
    }
  }, [user]);

  const handleStartFlow = (type: 'morning' | 'evening') => {
    // Calculate affirmation based on study day and time of day
    if (!user?.studyStartDate) {
      toast({
        title: 'Error',
        description: 'Study start date not found. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    const isMorning = type === 'morning';
    const affirmationIdx = getAffirmationIndex(user.studyStartDate, isMorning);
    setCurrentAffirmation(affirmations[affirmationIdx]);

    setAffirmationType(type);
    setFlowStartTime(new Date()); // Track when flow starts
    setFlowState('pre-stress');
  };

  const handlePreStressSubmit = (rating: number) => {
    setStressData({ ...stressData, pre: rating });
    setAffirmationStartTime(new Date()); // Track when affirmation is shown
    setFlowState('affirmation');
  };

  const handleContinueFromAffirmation = () => {
    setAffirmationEndTime(new Date()); // Track when user leaves affirmation
    setFlowState('post-stress');
  };

  const handlePostStressSubmit = async (rating: number) => {
    // We already have the user from the AuthContext
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save stress data.',
        variant: 'destructive',
      });
      return;
    }

    if (stressData.pre === null || !affirmationType) {
      toast({
        title: 'Error',
        description: 'Could not save your response due to missing pre-stress data or affirmation type.',
        variant: 'destructive',
      });
      return;
    }

    // Validate time tracking data
    if (!flowStartTime || !affirmationStartTime || !affirmationEndTime) {
      toast({
        title: 'Error',
        description: 'Could not save your response due to missing time tracking data.',
        variant: 'destructive',
      });
      return;
    }

    const flowEndTime = new Date();

    // Calculate durations in seconds
    const affirmationDurationSeconds = Math.round(
      (affirmationEndTime.getTime() - affirmationStartTime.getTime()) / 1000
    );
    const totalFlowDurationSeconds = Math.round(
      (flowEndTime.getTime() - flowStartTime.getTime()) / 1000
    );

    // This is the critical change: pass the user's UID as creatorId
    const stressDataToSave = {
      creatorId: user.uid,
      affirmationType: affirmationType!,
      affirmation: currentAffirmation,
      stressBefore: stressData.pre,
      stressAfter: rating,
      timestamp: new Date().toISOString(),
      // Time tracking data
      flowStartTime: flowStartTime.toISOString(),
      affirmationStartTime: affirmationStartTime.toISOString(),
      affirmationEndTime: affirmationEndTime.toISOString(),
      flowEndTime: flowEndTime.toISOString(),
      affirmationDurationSeconds,
      totalFlowDurationSeconds,
    };

    setStressData({ pre: stressData.pre, post: rating });

    try {
      const result = await saveStressData(stressDataToSave);
      if (result.success) {
        console.log("Stress data successfully saved!");
        toast({
          title: 'Stress data saved!',
          description: 'Your stress data has been successfully recorded.',
        });
        setFlowState('complete');
      } else {
        console.error("Error saving stress data:", result.error);
        toast({
          title: 'Error',
          description: `Could not save your response: ${result.error}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error saving stress data:", error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetFlow = () => {
    setFlowState('idle');
    setStressData({ pre: null, post: null });
    setAffirmationType(null);
    // Reset time tracking
    setFlowStartTime(null);
    setAffirmationStartTime(null);
    setAffirmationEndTime(null);
  };

  if (loading || !user || !isClient) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isEveningDisabled = currentHour === null || currentHour < 18;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center border-b" style={{ paddingTop: 'max(1rem, var(--safe-area-inset-top))', paddingLeft: 'max(1rem, var(--safe-area-inset-left))', paddingRight: 'max(1rem, var(--safe-area-inset-right))' }}>
        <h1 className="text-xl font-headline font-bold">care-kit</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')} className="gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowInstallGuide(true)}>
            <Install className="h-4 w-4" />
            <span className="sr-only">Installation guide</span>
          </Button>
          <NotificationToggle />
          <div className="text-right text-sm">
            <div>{user.email}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); router.push('/login'); }}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {flowState === 'idle' && (
            <>
              <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-center">Ready for your affirmation?</CardTitle>
                <CardDescription className="text-center">
                  You would normally receive a notification for these.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button size="lg" onClick={() => handleStartFlow('morning')}>
                  <Sunrise className="mr-2 h-5 w-5" />
                  Morning
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          size="lg"
                          onClick={() => handleStartFlow('evening')}
                          disabled={isEveningDisabled}
                          className="w-full"
                        >
                          {isEveningDisabled ? <Lock className="mr-2 h-5 w-5" /> : <Sunset className="mr-2 h-5 w-5" />}
                          Evening
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {isEveningDisabled && (
                      <TooltipContent>
                        <p>Evening affirmation unlocks at 6 PM.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
            </>
          )}

          {flowState === 'pre-stress' && (
            <StressRating
              title="Before we begin, how are you feeling?"
              description="Rate your current stress level from 1 (very calm) to 5 (very stressed)."
              onSubmit={handlePreStressSubmit}
            />
          )}

          {flowState === 'affirmation' && (
            <AffirmationCard
              affirmation={currentAffirmation}
              onContinue={handleContinueFromAffirmation}
            />
          )}

          {flowState === 'post-stress' && (
            <StressRating
              title="How are you feeling now?"
              description="Please rate your current stress level again."
              onSubmit={handlePostStressSubmit}
            />
          )}

          {flowState === 'complete' && (
            <Card className="shadow-lg text-center">
              <CardHeader>
                <CardTitle className="font-headline">Thank you!</CardTitle>
                <CardDescription>
                  Your response has been recorded. Your participation is greatly appreciated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={resetFlow}>
                  Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Floating install button - shows when not installed */}
      <InstallPWAButtonFloating />

      {/* Installation guide dialog */}
      <InstallGuideDialog open={showInstallGuide} onOpenChange={setShowInstallGuide} />
    </div>
  );
}
