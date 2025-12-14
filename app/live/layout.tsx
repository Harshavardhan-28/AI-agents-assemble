'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ProcessingProvider } from '@/components/ProcessingProvider';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1916] flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-3 h-3 bg-[#d4a574] rounded-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ProcessingProvider>
      <div className="min-h-screen bg-[#1a1916] text-[#f5e6d3]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="ml-64 min-h-screen">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </ProcessingProvider>
  );
}
