"use client";

import { useEffect, useState, useCallback } from 'react';
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
  const [fridgeImage, setFridgeImage] = useState<string | null>(null);
  const [allergies, setAllergies] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  // Handle image selection from the uploader
  const handleImageChange = useCallback((base64Image: string | null) => {
    setFridgeImage(base64Image);
  }, []);

  const handleGetRecipes = async () => {
    if (!user) return;
    setRecipesLoading(true);
    setError(null);
    
    try {
      const token = await user.getIdToken();
      
      // Build request body with optional image
      const requestBody: Record<string, unknown> = {};
      
      // Add fridge image if available (for Kestra AI Agent to analyze)
      if (fridgeImage) {
        requestBody.fridgeImage = fridgeImage;
      }
      
      // Add allergies if specified
      if (allergies.trim()) {
        requestBody.allergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
      }

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || 'Request failed');
      }

      const data: RecipeResponse = await res.json();
      setRecipeData(data);
    } catch (err) {
      console.error('Recipe generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recipes. Check server logs.');
    } finally {
      setRecipesLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">🍳 Smart Fridge Dashboard</h1>
          <p className="text-xs text-slate-400">
            Signed in as {user.displayName || user.email || 'anonymous user'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
            Powered by Kestra AI Agent
          </span>
          <button
            onClick={logout}
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <div className="flex-1 space-y-6">
          {/* Image Upload Section - Primary input for AI Agent */}
          <FridgeImageUploader onImageChange={handleImageChange} />
          
          {/* Manual Inventory - Backup/supplement to image analysis */}
          <InventoryManager uid={user.uid} />
        </div>
        
        <div className="flex-1 space-y-6">
          <PreferencesForm uid={user.uid} />

          {/* Allergies Input */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">⚠️ Food Allergies</h2>
            <p className="text-xs text-slate-400">
              Enter any food allergies (comma-separated). The AI Agent will ensure 
              recipes never contain these ingredients.
            </p>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g., peanuts, shellfish, dairy"
              className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </section>

          {/* Recipe Generation Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">🤖 AI Recipes</h2>
              <button
                onClick={handleGetRecipes}
                disabled={recipesLoading}
                className="rounded bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {recipesLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full"></span>
                    Analyzing...
                  </span>
                ) : fridgeImage ? (
                  '📷 Analyze Image & Get Recipes'
                ) : (
                  'Get Recipe Suggestions'
                )}
              </button>
            </div>
            
            {fridgeImage && (
              <p className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">
                ✓ Image ready - AI will analyze your fridge contents
              </p>
            )}
            
            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded border border-red-400/20">
                ⚠️ {error}
              </div>
            )}
            
            <RecipeResults data={recipeData} loading={recipesLoading} />
          </section>
        </div>
      </div>

      {/* Footer with Kestra info */}
      <footer className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        <p>
          This app uses <a href="https://kestra.io" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Kestra AI Agent</a> with 
          Gemini Vision to analyze fridge images, generate recipes, validate constraints, and ensure food safety.
        </p>
      </footer>
    </main>
  );
}
