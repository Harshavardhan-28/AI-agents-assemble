'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

const navItems = [
  { href: '/live', icon: '🏠', label: 'Home' },
  { href: '/live/inventory', icon: '🧊', label: 'Inventory' },
  { href: '/live/recipes', icon: '👨‍🍳', label: 'Recipes' },
  { href: '/live/shopping', icon: '🛒', label: 'Shopping' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1a1916] border-r border-[#d4a574]/20 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-[#d4a574]/20">
        <Link href="/live" className="flex items-center gap-3">
          <span className="text-3xl">🍳</span>
          <span className="text-xl font-bold text-[#d4a574]">Kitchen OS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#d4a574] text-[#1a1916]'
                    : 'text-[#f5e6d3] hover:bg-[#2a2520]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#d4a574]/20">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-[#d4a574]/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#d4a574]/20 flex items-center justify-center text-[#d4a574]">
                  {user.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f5e6d3] truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-[#8b7355] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-sm text-[#8b7355] hover:text-[#f5e6d3] hover:bg-[#2a2520] rounded-lg transition-all flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
