'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { NotificationProvider } from '@/components/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  );
}
