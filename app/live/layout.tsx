'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/live', label: 'Home', icon: '🏠' },
  { href: '/live/inventory', label: 'Inventory', icon: '🧊' },
  { href: '/live/recipes', label: 'Recipes', icon: '👨‍🍳' },
  { href: '/live/shopping', label: 'Shopping', icon: '🛒' },
];

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    <div className="min-h-screen bg-[#1a1916] text-[#f5e6d3]">
      {/* Header */}
      <header className="border-b border-[#d4a574]/20 bg-[#1a1916]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/live" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="font-bold text-[#d4a574]">Kitchen OS</span>
          </Link>
          
          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-[#d4a574]/20 text-[#d4a574]'
                    : 'text-[#8b7355] hover:text-[#f5e6d3]'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={logout}
            className="text-xs text-[#8b7355] hover:text-[#f5e6d3] transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Mobile Nav */}
        <nav className="sm:hidden flex justify-around border-t border-[#d4a574]/10 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs ${
                pathname === item.href ? 'text-[#d4a574]' : 'text-[#8b7355]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
