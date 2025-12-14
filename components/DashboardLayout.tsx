"use client";

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    displayName?: string | null;
    email?: string | null;
  };
  onLogout: () => void;
}

const NAV_ITEMS = [
  { 
    id: 'inventory', 
    label: 'Inventory', 
    icon: '📦',
    href: '#inventory',
    description: 'Manage fridge items'
  },
  { 
    id: 'scan', 
    label: 'Scan Fridge', 
    icon: '📷',
    href: '#scan',
    description: 'AI image analysis'
  },
  { 
    id: 'preferences', 
    label: 'Preferences', 
    icon: '⚙️',
    href: '#preferences',
    description: 'Cooking settings'
  },
  { 
    id: 'recipes', 
    label: 'Get Recipes', 
    icon: '🍳',
    href: '#recipes',
    description: 'AI suggestions'
  },
];

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className="sidebar"
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : -240
        }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Brand */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <motion.div 
              className="sidebar-logo"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              🍳
            </motion.div>
            <div>
              <h1 className="sidebar-title">Kitchen OS</h1>
              <p className="sidebar-subtitle">Smart Fridge v1.0</p>
            </div>
          </div>
          {/* Close sidebar button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close-btn"
            aria-label="Close sidebar"
          >
            ✕
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.1 }}
              onClick={() => scrollToSection(item.id)}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Footer with user info */}
        <div className="sidebar-footer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-md bg-kitchen-elevated border border-kitchen-border flex items-center justify-center text-sm">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warm-200 truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-2xs text-warm-600 truncate font-mono">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-ghost btn-sm w-full justify-start text-warm-500 hover:text-warm-300"
          >
            <span>↩</span>
            <span>Sign out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="content-header">
          {/* Menu toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost btn-icon"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? '◀' : '☰'}
          </button>
          
          <div className="flex items-center gap-3">
            <span className="badge badge-online">
              <span className="w-1.5 h-1.5 rounded-full bg-fresh-400 animate-pulse-soft" />
              AI Ready
            </span>
            <span className="text-xs font-mono text-warm-600">
              Powered by Kestra + Gemini
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-warm-500">
            <span className="font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Content */}
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
}
