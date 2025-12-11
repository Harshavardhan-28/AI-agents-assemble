"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LandingPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Auto-redirect to dashboard when logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading while checking auth or redirecting
  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-lg text-center space-y-8">
        {/* Logo/Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <span className="text-4xl">🍳</span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Smart Fridge Assistant
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
            Upload a photo of your fridge, and let AI suggest recipes based on what you have.
          </p>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Image Analysis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            AI Recipes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Smart Lists
          </span>
        </div>

        {/* Login Button */}
        <button
          onClick={loginWithGoogle}
          className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <p className="text-xs text-slate-600">
          Powered by Kestra AI Agent & Gemini Vision
        </p>
      </div>
    </main>
  );
}
