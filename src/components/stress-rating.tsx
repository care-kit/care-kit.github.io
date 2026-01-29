'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StressRatingProps {
  title: string;
  description: string;
  onSubmit: (rating: number) => void;
}

export default function StressRating({ title, description, onSubmit }: StressRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (selectedRating === null) {
      toast({
        title: "Selection required",
        description: "Please select a stress level before submitting.",
        variant: "destructive",
      });
      return;
    }
    onSubmit(selectedRating);
  };

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="font-headline text-center">{title}</CardTitle>
        <CardDescription className="text-center">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-2 md:gap-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant="outline"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full text-lg font-bold transition-all duration-200',
                selectedRating === rating ? 'bg-accent text-accent-foreground scale-110' : 'bg-background'
              )}
              onClick={() => setSelectedRating(rating)}
            >
              {rating}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSubmit}>
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
