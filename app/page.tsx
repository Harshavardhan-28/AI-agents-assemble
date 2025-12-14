"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

const features = [
  { 
    icon: '📷', 
    title: 'Scan Your Fridge', 
    description: 'AI analyzes photos to identify ingredients' 
  },
  { 
    icon: '📦', 
    title: 'Track Inventory', 
    description: 'Keep tabs on what you have at home' 
  },
  { 
    icon: '🍳', 
    title: 'Smart Recipes', 
    description: 'Get personalized recipe suggestions' 
  },
  { 
    icon: '📋', 
    title: 'Shopping Lists', 
    description: 'Auto-generate lists for missing items' 
  },
];

export default function LandingPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/live');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-kitchen-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div 
            className="text-5xl mb-4"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🍳
          </motion.div>
          <div className="loading-dots justify-center">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kitchen-bg overflow-hidden">
      {/* Warm background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-heat-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fresh-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-16 md:mb-24"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-fresh-400 to-fresh-600 rounded-lg flex items-center justify-center text-xl shadow-pixel">
              🍳
            </div>
            <div>
              <h1 className="text-lg font-semibold text-warm-100">Kitchen OS</h1>
              <p className="text-2xs font-mono text-warm-600 uppercase tracking-wider">Smart Fridge v1.0</p>
            </div>
          </div>
          <span className="badge badge-online">
            <span className="w-1.5 h-1.5 rounded-full bg-fresh-400" />
            AI Online
          </span>
        </motion.header>

        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-20">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-warm-50 leading-tight mb-6">
              Your fridge,
              <br />
              <span className="text-fresh-400">intelligently managed</span>
            </h2>
            <p className="text-lg text-warm-400 leading-relaxed mb-8 max-w-md">
              Upload a photo of your fridge and let AI suggest delicious recipes 
              based on what you have. Track inventory, save preferences, and never 
              wonder &quot;what&apos;s for dinner&quot; again.
            </p>
            
            {/* Login Button */}
            <motion.button
              onClick={loginWithGoogle}
              whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(111, 181, 114, 0.2)' }}
              whileTap={{ y: 1 }}
              className="btn btn-primary text-base h-14 px-8 gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>
            
            <p className="text-xs text-warm-600 mt-4 font-mono">
              Powered by Kestra AI Agent + Gemini Vision
            </p>
          </motion.div>

          {/* Right - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Mock app preview */}
            <div className="relative bg-kitchen-surface border-2 border-kitchen-border rounded-xl p-6 shadow-glow-soft">
              {/* Mock header */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-kitchen-border-subtle">
                <div className="w-3 h-3 rounded-full bg-coral-400" />
                <div className="w-3 h-3 rounded-full bg-heat-400" />
                <div className="w-3 h-3 rounded-full bg-fresh-400" />
                <span className="ml-2 text-xs font-mono text-warm-600">dashboard.kitchen.os</span>
              </div>
              
              {/* Mock inventory */}
              <div className="space-y-2 mb-4">
                <div className="text-2xs font-mono text-warm-500 uppercase tracking-wider mb-2">Inventory</div>
                {['🥛 Milk', '🥚 Eggs (6)', '🧀 Cheese', '🥬 Spinach'].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 p-2 bg-kitchen-elevated rounded-md border border-kitchen-border-subtle"
                  >
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Mock recipe suggestion */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-fresh-500/10 border border-fresh-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-medium text-fresh-400">AI Suggestion</span>
                </div>
                <p className="text-sm text-warm-300">Spinach & Cheese Omelette</p>
                <p className="text-xs text-warm-500 mt-1">15 min • Easy • 4 ingredients</p>
              </motion.div>
            </div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 w-16 h-16 bg-heat-500/20 rounded-xl flex items-center justify-center text-2xl border border-heat-500/30"
            >
              🥘
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -left-4 w-14 h-14 bg-fresh-500/20 rounded-xl flex items-center justify-center text-xl border border-fresh-500/30"
            >
              🥗
            </motion.div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-10">
            <h3 className="text-2xs font-mono text-warm-500 uppercase tracking-wider mb-2">Features</h3>
            <p className="text-xl font-semibold text-warm-200">Everything you need</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -4, borderColor: 'var(--fresh)' }}
                className="p-5 bg-kitchen-surface border-2 border-kitchen-border rounded-xl transition-colors"
              >
                <span className="text-2xl mb-3 block">{feature.icon}</span>
                <h4 className="font-semibold text-warm-200 mb-1">{feature.title}</h4>
                <p className="text-sm text-warm-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 pt-8 border-t border-kitchen-border-subtle text-center"
        >
          <p className="text-xs text-warm-600">
            Built with Next.js • Powered by{' '}
            <a 
              href="https://kestra.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-fresh-400 hover:text-fresh-300 transition-colors"
            >
              Kestra
            </a>
            {' '}+ Gemini Vision
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
