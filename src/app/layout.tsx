import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'brain-kit.uk',
  description: 'A study on the effects of daily affirmations on stress levels.',
  icons: {
    icon: '/brain-kit-capacitor-logo.png',
    shortcut: '/brain-kit-capacitor-logo.png',
    apple: '/brain-kit-capacitor-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/brain-kit-capacitor-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/brain-kit-capacitor-logo.png" />
        <link rel="shortcut icon" href="/brain-kit-capacitor-logo.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BRAIN KIT" />
        <link rel="apple-touch-icon" href="/brain-kit-capacitor-logo.png" />

        {/* Theme Color */}
        <meta name="theme-color" content="#000000" />

        {/* SPA routing restoration for GitHub Pages */}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            const params = new URLSearchParams(window.location.search);
            const path = params.get('p');
            if (path) {
              window.history.replaceState(null, '', path);
            }
          })();
        `}} />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased h-full')}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
