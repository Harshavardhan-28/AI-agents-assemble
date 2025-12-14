import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Kitchen OS - Smart Fridge',
  description: 'AI-powered recipe assistant for your fridge and pantry.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-kitchen-bg text-warm-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
