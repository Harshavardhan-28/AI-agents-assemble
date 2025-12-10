"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { InventoryManager } from '@/components/InventoryManager';
import { PreferencesForm } from '@/components/PreferencesForm';
import { FridgeImageUploader } from '@/components/FridgeImageUploader';
import { RecipeResults } from '@/components/RecipeResults';
import type { RecipeResponse } from '@/lib/types';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const handleGetRecipes = async () => {
    if (!user) return;
    setRecipesLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const data: RecipeResponse = await res.json();
      setRecipeData(data);
    } catch {
      setError('Failed to generate recipes. Check server logs.');
    } finally {
      setRecipesLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading your dashboard...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Smart Fridge Dashboard</h1>
          <p className="text-xs text-slate-400">
            Signed in as {user.displayName || user.email || 'anonymous user'}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700"
        >
          Log out
        </button>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <div className="flex-1 space-y-6">
          <InventoryManager uid={user.uid} />
          <FridgeImageUploader />
        </div>
        <div className="flex-1 space-y-6">
          <PreferencesForm uid={user.uid} />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">AI Recipes</h2>
              <button
                onClick={handleGetRecipes}
                className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Get recipe suggestions
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <RecipeResults data={recipeData} loading={recipesLoading} />
          </section>
        </div>
      </div>
    </main>
  );
}
