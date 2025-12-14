'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { triggerRecipeFlow } from '@/lib/kestraService';
import type { DifficultyLevel } from '@/lib/types';

export default function RecipesPage() {
  const { user } = useAuth();
  const { data, loading } = useFirebaseRealtime(user?.uid || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [prefs, setPrefs] = useState({
    skillLevel: 'beginner' as DifficultyLevel,
    time: 30,
    dietary: 'None',
    allergies: '',
  });

  const handleGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      await triggerRecipeFlow(
        user.uid,
        prefs.skillLevel,
        prefs.time,
        prefs.dietary,
        prefs.allergies || 'None'
      );
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  const recipes = data?.recipes?.recipes || [];
  const inventoryCount = data?.inventory?.length || 0;

  return (
    <div className="space-y-6">
      {/* Generate Section */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <h2 className="text-lg font-semibold text-[#d4a574] mb-4">👨‍🍳 Generate Recipes</h2>
        
        {inventoryCount === 0 ? (
          <p className="text-sm text-[#8b7355] py-4 text-center">
            Add items to your inventory first to generate recipes.
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-[#8b7355] block mb-1">Skill Level</label>
                <select
                  value={prefs.skillLevel}
                  onChange={(e) => setPrefs(p => ({ ...p, skillLevel: e.target.value as DifficultyLevel }))}
                  className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-3 py-2 text-sm text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none"
                >
                  <option value="beginner">🍳 Beginner</option>
                  <option value="intermediate">👨‍🍳 Intermediate</option>
                  <option value="advanced">⭐ Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8b7355] block mb-1">Time: {prefs.time} min</label>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={prefs.time}
                  onChange={(e) => setPrefs(p => ({ ...p, time: parseInt(e.target.value) }))}
                  className="w-full accent-[#d4a574] mt-2"
                />
              </div>
              <div>
                <label className="text-xs text-[#8b7355] block mb-1">Dietary</label>
                <select
                  value={prefs.dietary}
                  onChange={(e) => setPrefs(p => ({ ...p, dietary: e.target.value }))}
                  className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-3 py-2 text-sm text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none"
                >
                  <option value="None">None</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Keto">Keto</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8b7355] block mb-1">Allergies</label>
                <input
                  type="text"
                  value={prefs.allergies}
                  onChange={(e) => setPrefs(p => ({ ...p, allergies: e.target.value }))}
                  placeholder="e.g., nuts, dairy"
                  className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-3 py-2 text-sm text-[#f5e6d3] placeholder:text-[#8b7355]/50 focus:border-[#d4a574] focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                isGenerating
                  ? 'bg-[#8b7355]/30 text-[#8b7355] cursor-not-allowed'
                  : 'bg-[#d4a574] text-[#1a1916] hover:bg-[#c49464]'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🍳</motion.span>
                  Cooking up ideas...
                </span>
              ) : (
                '✨ Generate Recipes'
              )}
            </button>
          </>
        )}
      </div>

      {/* Recipes Display */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#d4a574]">📖 Your Recipes</h2>
          {recipes.length > 0 && (
            <span className="text-xs bg-[#d4a574]/20 text-[#d4a574] px-2 py-0.5 rounded-full">
              {recipes.length} recipes
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-2xl">
              🔄
            </motion.div>
          </div>
        ) : recipes.length === 0 ? (
          <p className="text-center text-[#8b7355] py-8 text-sm">
            No recipes yet. Generate some based on your inventory!
          </p>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1916] rounded-xl border border-[#8b7355]/20 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium text-[#f5e6d3]">{recipe.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-[#8b7355]">⏱️ {recipe.estimatedTimeMinutes}m</span>
                      <span className="text-xs text-[#8b7355]">📊 {recipe.difficulty}</span>
                    </div>
                  </div>
                  <motion.span
                    animate={{ rotate: expandedRecipe === i ? 180 : 0 }}
                    className="text-[#8b7355]"
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence>
                  {expandedRecipe === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-[#8b7355]/20 pt-3">
                        <div className="mb-3">
                          <span className="text-xs text-[#d4a574] font-medium">Ingredients</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {recipe.ingredients.map((ing, j) => (
                              <span key={j} className="text-xs bg-[#2a2520] px-2 py-1 rounded text-[#8b7355]">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-[#d4a574] font-medium">Steps</span>
                          <ol className="mt-1 space-y-1.5">
                            {recipe.steps.map((step, j) => (
                              <li key={j} className="text-xs text-[#8b7355] flex gap-2">
                                <span className="text-[#d4a574]">{j + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
