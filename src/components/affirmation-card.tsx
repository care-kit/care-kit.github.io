'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from '@/components/icons';

interface AffirmationCardProps {
  affirmation: string;
  onContinue: () => void;
}

export default function AffirmationCard({ affirmation, onContinue }: AffirmationCardProps) {
  return (
    <Card className="shadow-lg text-center animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="font-headline">Your Affirmation</CardTitle>
        <CardDescription>Take a moment to read and reflect.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold font-headline text-accent-foreground leading-relaxed">
          {affirmation}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onContinue}>
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
