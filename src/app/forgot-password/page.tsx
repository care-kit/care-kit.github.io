
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Heart } from '@/components/icons';
import { FirebaseError } from 'firebase/app';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setEmailSent(true);
    } catch (error: any) {
      console.error(error);
      let description = 'Could not send reset email. Please try again later.';
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          // To avoid email enumeration attacks, we show a generic success message
          // but you could also show a generic error. For this study, a success
          // message is fine as it avoids user confusion.
          setEmailSent(true);
          return;
        }
      }
      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-full w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <Heart className="mx-auto h-12 w-12 text-primary-foreground fill-accent mb-4" />
          <CardTitle className="font-headline text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {emailSent
              ? 'Check your inbox for a password reset link.'
              : 'Enter your email to receive a password reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center">
              <MailCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <p className="text-muted-foreground">If an account with that email exists, an email has been sent.</p>
              <Button asChild className="mt-6 w-full">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
           <div className="mt-4 text-center text-sm">
              <Link href="/login" className="underline text-accent-foreground font-medium">
                Remember your password? Log in
              </Link>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
