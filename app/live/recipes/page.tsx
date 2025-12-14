'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { useProcessing } from '@/components/ProcessingProvider';
import { ref, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';
import type { DifficultyLevel } from '@/lib/types';

interface Recipe {
  title: string;
  estimatedTimeMinutes: number;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  category?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  breakfast: { icon: '🍳', label: 'Breakfast', color: 'bg-yellow-500/20 border-yellow-500/30' },
  lunch: { icon: '🥗', label: 'Lunch', color: 'bg-green-500/20 border-green-500/30' },
  dinner: { icon: '🍽️', label: 'Dinner', color: 'bg-blue-500/20 border-blue-500/30' },
  snacks: { icon: '🍿', label: 'Snacks', color: 'bg-purple-500/20 border-purple-500/30' },
  dessert: { icon: '🍰', label: 'Dessert', color: 'bg-pink-500/20 border-pink-500/30' },
  drinks: { icon: '🍹', label: 'Drinks', color: 'bg-cyan-500/20 border-cyan-500/30' },
  other: { icon: '🍴', label: 'Other', color: 'bg-gray-500/20 border-gray-500/30' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  easy: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
  hard: 'bg-red-500/20 text-red-400',
};

export default function RecipesPage() {
  const { user } = useAuth();
  const { data, loading } = useFirebaseRealtime(user?.uid || null);
  const { startProcessing, stopProcessing, isProcessing } = useProcessing();
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [generatingShoppingFor, setGeneratingShoppingFor] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({
    skillLevel: 'beginner' as DifficultyLevel,
    time: 30,
    dietary: 'None',
    allergies: '',
  });
  const previousRecipesRef = useRef<string | null>(null);
  const previousShoppingRef = useRef<string | null>(null);

  // Watch for recipe changes to detect when Kestra finishes
  useEffect(() => {
    if (isProcessing('recipes') && previousRecipesRef.current !== null) {
      const currentRecipes = JSON.stringify(data?.recipes || {});
      if (previousRecipesRef.current !== currentRecipes) {
        stopProcessing();
        previousRecipesRef.current = null;
      }
    }
  }, [data?.recipes, isProcessing, stopProcessing]);

  const handleClearRecipes = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to clear all recipes?')) return;
    try {
      const db = getFirebaseDatabase();
      await set(ref(db, `users/${user.uid}/recipes`), null);
    } catch (err) {
      console.error('Error clearing recipes:', err);
    }
  };

  // Watch for shopping list changes
  useEffect(() => {
    if (isProcessing('shopping') && previousShoppingRef.current !== null) {
      const currentShopping = JSON.stringify(data?.shopping_list || []);
      if (previousShoppingRef.current !== currentShopping) {
        stopProcessing();
        previousShoppingRef.current = null;
        // Open shopping page if we were generating for a specific recipe
        if (generatingShoppingFor !== null) {
          const recipesList = data?.recipes?.recipes || [];
          const recipe = recipesList[generatingShoppingFor];
          if (recipe) {
            window.open('/live/shopping?recipe=' + encodeURIComponent(recipe.title), '_blank');
          }
          setGeneratingShoppingFor(null);
        }
      }
    }
  }, [data?.shopping_list, data?.recipes?.recipes, isProcessing, stopProcessing, generatingShoppingFor]);

  const handleGenerate = async () => {
    if (!user || isProcessing()) return;
    
    // Capture current recipes state BEFORE starting processing
    previousRecipesRef.current = JSON.stringify(data?.recipes || {});
    
    startProcessing('recipes', 'Our AI chef is cooking up personalized recipes for you...');

    try {
      const response = await fetch('/api/kestra/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          skillLevel: prefs.skillLevel,
          availableTime: prefs.time,
          dietaryRestriction: prefs.dietary,
          allergies: prefs.allergies || 'None'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger recipe flow');
      }
      // Don't stop processing - wait for Firebase update
    } catch (err) {
      console.error('Error:', err);
      stopProcessing();
    }
  };

  const handleGenerateShoppingList = async (recipe: Recipe, index: number) => {
    if (!user || isProcessing()) return;
    setGeneratingShoppingFor(index);
    
    // Capture current shopping list state BEFORE starting processing
    previousShoppingRef.current = JSON.stringify(data?.shopping_list || []);
    
    startProcessing('shopping', `Creating shopping list for "${recipe.title}"...`);

    try {
      const response = await fetch('/api/kestra/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          recipeName: recipe.title,
          recipeIngredients: recipe.ingredients
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate shopping list');
      }
      // Don't stop processing - wait for Firebase update
    } catch (err) {
      console.error('Error:', err);
      setGeneratingShoppingFor(null);
      stopProcessing();
    }
  };

  const recipes: Recipe[] = data?.recipes?.recipes || [];
  const inventoryCount = data?.inventory?.length || 0;

  // Group recipes by category
  const groupedRecipes = recipes.reduce((acc, recipe, index) => {
    const category = recipe.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ ...recipe, _index: index });
    return acc;
  }, {} as Record<string, (Recipe & { _index: number })[]>);

  // Filter recipes by selected category
  const displayRecipes = selectedCategory 
    ? (groupedRecipes[selectedCategory] || [])
    : recipes.map((r, i) => ({ ...r, _index: i }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d4a574]">👨‍🍳 Recipes</h1>
        <div className="flex items-center gap-2">
          {recipes.length > 0 && (
            <button
              onClick={handleClearRecipes}
              className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm"
            >
              🗑️ Clear All
            </button>
          )}
          <span className="text-sm bg-[#d4a574]/20 text-[#d4a574] px-3 py-1 rounded-full">
            {recipes.length} recipes
          </span>
        </div>
      </div>

      {/* Generate Section */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <h2 className="text-lg font-semibold text-[#d4a574] mb-4">✨ Generate New Recipes</h2>
        
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
              disabled={isProcessing()}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                isProcessing()
                  ? 'bg-[#8b7355]/30 text-[#8b7355] cursor-not-allowed'
                  : 'bg-[#d4a574] text-[#1a1916] hover:bg-[#c49464]'
              }`}
            >
              {isProcessing('recipes') ? (
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

      {/* Category Filter */}
      {recipes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-[#d4a574] text-[#1a1916]'
                : 'bg-[#2a2520] text-[#8b7355] border border-[#8b7355]/30 hover:border-[#d4a574]/50'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = groupedRecipes[key]?.length || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? 'bg-[#d4a574] text-[#1a1916]'
                    : 'bg-[#2a2520] text-[#8b7355] border border-[#8b7355]/30 hover:border-[#d4a574]/50'
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-xs">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Recipes Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-3xl">🔄</motion.div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-[#2a2520] rounded-xl p-8 border border-[#d4a574]/20 text-center">
          <span className="text-4xl block mb-3">📖</span>
          <p className="text-[#8b7355]">No recipes yet. Generate some based on your inventory!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayRecipes.map((recipe) => {
            const config = CATEGORY_CONFIG[recipe.category || 'other'] || CATEGORY_CONFIG.other;
            const difficultyClass = DIFFICULTY_COLORS[recipe.difficulty?.toLowerCase()] || DIFFICULTY_COLORS.intermediate;
            const isExpanded = expandedRecipe === recipe._index;
            
            return (
              <motion.div
                key={recipe._index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border overflow-hidden ${config.color}`}
              >
                <button
                  onClick={() => setExpandedRecipe(isExpanded ? null : recipe._index)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{config.icon}</span>
                        <h3 className="font-semibold text-[#f5e6d3]">{recipe.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-[#1a1916]/50 px-2 py-1 rounded-full text-[#8b7355]">
                          ⏱️ {recipe.estimatedTimeMinutes} min
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${difficultyClass}`}>
                          📊 {recipe.difficulty}
                        </span>
                        <span className="text-xs bg-[#1a1916]/50 px-2 py-1 rounded-full text-[#8b7355]">
                          🥘 {recipe.ingredients.length} ingredients
                        </span>
                      </div>
                    </div>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="text-[#8b7355] ml-2"
                    >
                      ▼
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-[#d4a574] mb-2">🥘 Ingredients</h4>
                          <div className="flex flex-wrap gap-2">
                            {recipe.ingredients.map((ing, j) => (
                              <span key={j} className="text-xs bg-[#1a1916]/50 border border-white/10 px-2.5 py-1.5 rounded-lg text-[#f5e6d3]">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-[#d4a574] mb-2">📝 Steps</h4>
                          <ol className="space-y-2">
                            {recipe.steps.map((step, j) => (
                              <li key={j} className="flex gap-3 text-sm">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#d4a574]/20 rounded-full flex items-center justify-center text-[#d4a574] text-xs font-medium">
                                  {j + 1}
                                </span>
                                <span className="text-[#f5e6d3]/80 pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateShoppingList(recipe, recipe._index);
                          }}
                          disabled={isProcessing()}
                          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                            isProcessing()
                              ? 'bg-[#8b7355]/30 text-[#8b7355] cursor-not-allowed'
                              : 'bg-[#d4a574] text-[#1a1916] hover:bg-[#c49464]'
                          }`}
                        >
                          {generatingShoppingFor === recipe._index ? (
                            <>
                              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🛒</motion.span>
                              Generating list...
                            </>
                          ) : (
                            <>
                              🛒 Generate Shopping List
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
