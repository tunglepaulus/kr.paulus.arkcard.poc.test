import { ThemeProvider } from 'next-themes';

import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import QueryProvider from '@/contexts/query-provider';
import ProgressBar from '@/providers/progress-bar';

import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Ark.Works Card Wallet',
  description: 'Identity on Ark.Works',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='antialiased'>
        <ProgressBar />
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          forcedTheme='dark' // Remove this if you want to allow light mode
          enableSystem={false}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <QueryProvider>{children}</QueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
