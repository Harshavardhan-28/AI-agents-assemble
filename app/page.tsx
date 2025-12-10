"use client";

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function LandingPage() {
  const { user, loginWithGoogle } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Smart Fridge Recipe Assistant
        </h1>
        <p className="text-slate-300">
          Snap your fridge, track your pantry, and get AI-powered recipe
          suggestions plus smart shopping lists.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400"
            >
              Go to dashboard
            </Link>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400"
            >
              Log in with Google
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Hackathon prototype. Connects to Firebase Auth, Realtime Database, and
          Gemini for recipe planning.
        </p>
      </div>
    </main>
  );
}
