'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Bell, Download, ArrowRight } from '@/components/icons';
import { FirebaseError } from 'firebase/app';
import { requestNotificationPermission, saveFCMTokenToUser } from '@/lib/notifications';

type AuthMode = 'initial' | 'login' | 'signup';
type SignupStep = 'welcome' | 'name' | 'memorable-word' | 'credentials' | 'notifications' | 'install' | 'platform-select' | 'install-manual';
type Platform = 'ios' | 'android' | 'other';

interface FormData {
  name: string;
  memorableCodeWord: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  name?: string;
  memorableCodeWord?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('initial');
  const [signupStep, setSignupStep] = useState<SignupStep>('welcome');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    memorableCodeWord: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { login, signup, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    console.log('Login page - loading:', loading, 'user:', !!user);
    // Only redirect if user exists, not in signup flow, and not on notification/install steps
    const isInSignupFlow = authMode === 'signup' && ['notifications', 'install', 'platform-select', 'install-manual'].includes(signupStep);
    if (!loading && user && !isInSignupFlow && authMode !== 'signup') {
      console.log('User authenticated, redirecting to dashboard');
      router.push('/');
    }
  }, [user, loading, router, authMode, signupStep]);

  // Validation functions
  const validateName = (): boolean => {
    const trimmed = formData.name.trim();
    if (!trimmed) {
      setFieldErrors({ ...fieldErrors, name: 'Please enter your name' });
      return false;
    }
    if (trimmed.length < 2) {
      setFieldErrors({ ...fieldErrors, name: 'Name must be at least 2 characters' });
      return false;
    }
    setFieldErrors({ ...fieldErrors, name: undefined });
    return true;
  };

  const validateMemorableWord = (): boolean => {
    const trimmed = formData.memorableCodeWord.trim();
    if (!trimmed) {
      setFieldErrors({ ...fieldErrors, memorableCodeWord: 'Please enter your memorable word' });
      return false;
    }
    if (trimmed.length < 3) {
      setFieldErrors({ ...fieldErrors, memorableCodeWord: 'Memorable word must be at least 3 characters' });
      return false;
    }
    setFieldErrors({ ...fieldErrors, memorableCodeWord: undefined });
    return true;
  };

  const validateCredentials = (): boolean => {
    let isValid = true;
    const errors: FieldErrors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Login handler
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      return;
    }

    setIsSubmitting(true);
    setLoginError('');
    try {
      await login(loginEmail, loginPassword);
    } catch (error: any) {
      console.error(error);
      // Parse Firebase error codes to user-friendly messages
      let errorMessage = 'Failed to log in. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      setLoginError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Signup step navigation
  const handleContinueFromWelcome = () => {
    setSignupStep('name');
  };

  const handleContinueFromName = () => {
    if (validateName()) {
      setSignupStep('memorable-word');
    }
  };

  const handleContinueFromMemorableWord = () => {
    if (validateMemorableWord()) {
      setSignupStep('credentials');
    }
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCredentials()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData.email, formData.password, formData.name, formData.memorableCodeWord);
      // Wait a moment for user to be set
      setTimeout(() => {
        setSignupStep('notifications');
        setIsSubmitting(false);
      }, 1000);
    } catch (error: any) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token && user?.uid) {
        await saveFCMTokenToUser(user.uid, token);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }

    // Move to install step
    setSignupStep('install');
  };

  const handleSkipNotifications = () => {
    setSignupStep('install');
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          router.push('/');
        }
        // If dismissed, stay on install step - user can click "Didn't work?" if needed
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // Stay on install step - user can click "Didn't work?" if needed
      }
    }
    // If no deferredPrompt, do nothing - user should click "Didn't work?" for manual instructions
  };

  const handleDidntWork = () => {
    setSignupStep('platform-select');
  };

  const handlePlatformSelect = (selectedPlatform: Platform) => {
    setPlatform(selectedPlatform);
    setSignupStep('install-manual');
  };

  const handleSkipInstall = () => {
    router.push('/');
  };

  const handleBack = () => {
    if (authMode === 'login') {
      setAuthMode('initial');
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
    } else if (authMode === 'signup') {
      if (signupStep === 'welcome') {
        setAuthMode('initial');
        setSignupStep('welcome');
        setFormData({
          name: '',
          memorableCodeWord: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setFieldErrors({});
      } else if (signupStep === 'name') {
        setSignupStep('welcome');
      } else if (signupStep === 'memorable-word') {
        setSignupStep('name');
      } else if (signupStep === 'credentials') {
        setSignupStep('memorable-word');
      }
    }
  };

  // Wait for client-side hydration
  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and not in signup flow, show loading while redirecting
  const isInSignupFlow = authMode === 'signup' && ['notifications', 'install', 'platform-select', 'install-manual'].includes(signupStep);
  if (user && !isInSignupFlow && authMode !== 'signup') {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render initial view
  const renderInitialView = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Care Kit</CardTitle>
        <CardDescription>Begin your journey to well-being.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => setAuthMode('login')}
          className="w-full"
        >
          Sign In
        </Button>
        <Button
          onClick={() => setAuthMode('signup')}
          variant="outline"
          className="w-full"
        >
          Sign Up
        </Button>
      </CardContent>
    </Card>
  );

  // Render login form
  const renderLoginForm = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
        <CardDescription>Log in to continue your affirmation journey.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                setLoginError('');
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                setLoginError('');
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </Button>
        </form>

        {loginError && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{loginError}</p>
          </div>
        )}

        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="w-full"
            disabled={isSubmitting}
          >
            ← Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render notification setup step
  const renderNotificationStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Bell className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Stay on Track</CardTitle>
        <CardDescription>Get gentle reminders for your daily affirmations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleEnableNotifications}
          className="w-full"
        >
          Enable Notifications
        </Button>
        <Button
          onClick={handleSkipNotifications}
          variant="ghost"
          className="w-full"
        >
          Skip for Now
        </Button>
      </CardContent>
    </Card>
  );

  // Render install step
  const renderInstallStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Download className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Add to Home Screen</CardTitle>
        <CardDescription>Install Care Kit for faster access and a better experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleInstallApp}
          className="w-full"
        >
          Add to Home Screen
        </Button>
        <Button
          onClick={handleDidntWork}
          variant="outline"
          className="w-full"
        >
          Didn't work?
        </Button>
        <Button
          onClick={handleSkipInstall}
          variant="ghost"
          className="w-full"
        >
          Skip for Now
        </Button>
      </CardContent>
    </Card>
  );

  // Render platform selection step
  const renderPlatformSelectStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Download className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Select Your Device</CardTitle>
        <CardDescription>Choose your device type to see specific installation instructions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => handlePlatformSelect('ios')}
          variant="outline"
          className="w-full"
        >
          iPhone or iPad
        </Button>
        <Button
          onClick={() => handlePlatformSelect('android')}
          variant="outline"
          className="w-full"
        >
          Android Device
        </Button>
        <Button
          onClick={() => handlePlatformSelect('other')}
          variant="outline"
          className="w-full"
        >
          Other / Desktop
        </Button>
        <Button
          onClick={handleSkipInstall}
          variant="ghost"
          className="w-full text-sm"
        >
          Skip, Continue to App
        </Button>
      </CardContent>
    </Card>
  );

  // Render manual install instructions
  const renderManualInstallStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Download className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Add to Home Screen</CardTitle>
        <CardDescription>
          {platform === 'ios' ? (
            <div className="text-left space-y-2 mt-2">
              <p className="font-medium">On iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                <li>Tap the <strong>Share</strong> button (square with arrow up)</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> in the top right corner</li>
              </ol>
            </div>
          ) : platform === 'android' ? (
            <div className="text-left space-y-2 mt-2">
              <p className="font-medium">On Android:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                <li>Tap the <strong>three dots</strong> menu (⋮)</li>
                <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong></li>
                <li>Tap <strong>Add</strong> or <strong>Install</strong></li>
              </ol>
            </div>
          ) : (
            <div className="text-left space-y-2 mt-2">
              <p className="text-sm">Use your browser's menu to install this app to your desktop.</p>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleSkipInstall}
          className="w-full"
        >
          Got it, Continue to App
        </Button>
      </CardContent>
    </Card>
  );

  // Render signup welcome step
  const renderWelcomeStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Hello, welcome to Care Kit</CardTitle>
        <CardDescription>Let's get you set up. This will only take a moment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleContinueFromWelcome}
          className="w-full"
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="w-full"
        >
          ← Back
        </Button>
      </CardContent>
    </Card>
  );

  // Render name step
  const renderNameStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">What's your name?</CardTitle>
        <CardDescription>We'd love to know what to call you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setFieldErrors({ ...fieldErrors, name: undefined });
            }}
            onBlur={validateName}
            autoFocus
          />
          {fieldErrors.name && (
            <p className="text-sm text-destructive">{fieldErrors.name}</p>
          )}
        </div>
        <Button
          onClick={handleContinueFromName}
          className="w-full"
          disabled={!formData.name.trim()}
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="w-full"
        >
          ← Back
        </Button>
      </CardContent>
    </Card>
  );

  // Render memorable word step
  const renderMemorableWordStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">What's your memorable word from the survey?</CardTitle>
        <CardDescription>This helps us connect your data securely.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="memorableWord">Memorable Word</Label>
          <Input
            id="memorableWord"
            type="text"
            placeholder="Your memorable word"
            value={formData.memorableCodeWord}
            onChange={(e) => {
              setFormData({ ...formData, memorableCodeWord: e.target.value });
              setFieldErrors({ ...fieldErrors, memorableCodeWord: undefined });
            }}
            onBlur={validateMemorableWord}
            autoFocus
          />
          {fieldErrors.memorableCodeWord && (
            <p className="text-sm text-destructive">{fieldErrors.memorableCodeWord}</p>
          )}
        </div>
        <Button
          onClick={handleContinueFromMemorableWord}
          className="w-full"
          disabled={!formData.memorableCodeWord.trim()}
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="w-full"
        >
          ← Back
        </Button>
      </CardContent>
    </Card>
  );

  // Render credentials step
  const renderCredentialsStep = () => (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
        <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
        <CardDescription>Just a few more details to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              required
              disabled={isSubmitting}
              autoFocus
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setFieldErrors({ ...fieldErrors, password: undefined });
              }}
              required
              disabled={isSubmitting}
            />
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
              }}
              required
              disabled={isSubmitting}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="w-full"
            disabled={isSubmitting}
          >
            ← Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render signup flow based on current step
  const renderSignupFlow = () => {
    switch (signupStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'name':
        return renderNameStep();
      case 'memorable-word':
        return renderMemorableWordStep();
      case 'credentials':
        return renderCredentialsStep();
      case 'notifications':
        return renderNotificationStep();
      case 'install':
        return renderInstallStep();
      case 'platform-select':
        return renderPlatformSelectStep();
      case 'install-manual':
        return renderManualInstallStep();
      default:
        return renderWelcomeStep();
    }
  };

  // Main render logic
  const renderContent = () => {
    switch (authMode) {
      case 'initial':
        return renderInitialView();
      case 'login':
        return renderLoginForm();
      case 'signup':
        return renderSignupFlow();
      default:
        return renderInitialView();
    }
  };

  return (
    <main className="flex min-h-full w-full items-center justify-center bg-background p-4">
      <div key={`${authMode}-${signupStep}`} className="animate-fade-in">
        {renderContent()}
      </div>
    </main>
  );
}
