
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PwaRegister } from '@/components/pwa-register';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'ISRA EthniConnect | Boutique Billing',
  description: 'Premium Billing and Inventory System for ISRA Ethnics',
  manifest: '/manifest.json',
  applicationName: 'ISRA EthniConnect',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ISRA EthniConnect',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="font-body antialiased bg-background">
        <AuthProvider>
          <PwaRegister />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
