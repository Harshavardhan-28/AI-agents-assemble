"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InventoryManager } from '@/components/InventoryManager';
import { PreferencesForm } from '@/components/PreferencesForm';
import { FridgeImageUploader } from '@/components/FridgeImageUploader';
import { RecipeResults } from '@/components/RecipeResults';
import { 
  motion, 
  AnimatePresence,
  Button,
  CookingLoader,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/motion-primitives';
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

  const handleImageChange = useCallback((base64Image: string | null) => {
    setFridgeImage(base64Image);
  }, []);

  const handleGetRecipes = async () => {
    if (!user) return;
    setRecipesLoading(true);
    setError(null);
    
    try {
      const token = await user.getIdToken();
      const requestBody: Record<string, unknown> = {};
      
      if (fridgeImage) {
        requestBody.fridgeImage = fridgeImage;
      }
      
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

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.details || responseData.error || 'Request failed');
      }

      const data: RecipeResponse = responseData;
      setRecipeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipes.');
    } finally {
      setRecipesLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-kitchen-bg">
        <CookingLoader message="Warming up the kitchen..." />
      </main>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout 
      user={{ displayName: user.displayName, email: user.email }}
      onLogout={logout}
    >
      {/* Two Column Layout: 30% Left, 70% Right */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN - 30% - Upload & Inventory */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6">
          <StaggerContainer className="space-y-6">
            {/* Section: Scan Fridge */}
            <StaggerItem>
              <section id="scan" className="panel">
                <div className="section-header">
                  <h2 className="section-title">📷 Scan Fridge</h2>
                </div>
                <FridgeImageUploader onImageChange={handleImageChange} />
              </section>
            </StaggerItem>

            {/* Section: Inventory */}
            <StaggerItem>
              <section id="inventory" className="panel">
                <div className="section-header">
                  <h2 className="section-title">📦 Inventory</h2>
                </div>
                <InventoryManager uid={user.uid} />
              </section>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* RIGHT COLUMN - 70% - Preferences & Recipes */}
        <div className="w-full lg:w-[70%] flex flex-col gap-6">
          <StaggerContainer className="space-y-6">
            {/* Section: Preferences */}
            <StaggerItem>
              <section id="preferences" className="panel">
                <div className="section-header">
                  <h2 className="section-title">⚙️ Preferences</h2>
                </div>
                <PreferencesForm uid={user.uid} />

                {/* Allergies subsection */}
                <div className="mt-6 pt-6 border-t border-kitchen-border-subtle">
                  <label className="label">Food Allergies</label>
                  <p className="text-xs text-warm-600 mb-3">
                    Enter any allergies (comma-separated). AI will exclude these ingredients.
                  </p>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g., peanuts, shellfish, dairy"
                    className="input"
                  />
                </div>
              </section>
            </StaggerItem>

            {/* Section: Get Recipes */}
            <StaggerItem>
              <section id="recipes" className="panel flex-1">
                <div className="section-header">
                  <h2 className="section-title">🍳 AI Recipes</h2>
                  <Button
                    variant="heat"
                    onClick={handleGetRecipes}
                    disabled={recipesLoading}
                    loading={recipesLoading}
                  >
                    {fridgeImage ? (
                      <>
                        <span>📷</span>
                        Analyze & Cook
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Get Recipes
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Status indicators */}
                <AnimatePresence mode="wait">
                  {fridgeImage && !recipesLoading && (
                    <motion.div
                      key="image-ready"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-3 bg-fresh-500/10 border border-fresh-500/30 rounded-lg flex items-center gap-2"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-fresh-400"
                      >
                        ✓
                      </motion.span>
                      <span className="text-sm text-fresh-400">
                        Image ready — AI will analyze your fridge contents
                      </span>
                    </motion.div>
                  )}
                  
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-3 bg-coral-500/10 border border-coral-500/30 rounded-lg flex items-center gap-2"
                    >
                      <span>⚠️</span>
                      <span className="text-sm text-coral-400">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Recipe Results */}
                <RecipeResults data={recipeData} loading={recipesLoading} />
              </section>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>

      {/* Footer - Outside columns */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 pt-6 border-t border-kitchen-border-subtle text-center"
      >
        <p className="text-xs text-warm-600 font-mono">
          Kitchen OS v1.0 • Powered by Kestra AI Agent + Gemini Vision
        </p>
      </motion.footer>
    </DashboardLayout>
  );
}
