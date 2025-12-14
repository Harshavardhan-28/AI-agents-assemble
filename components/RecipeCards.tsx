'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { RecipeResponse, RecipeSuggestion } from '@/lib/types';

interface Recipe {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  cookTime?: number | string;
  difficulty?: string;
  ingredients?: string[];
  instructions?: string[];
  steps?: string[];
  servings?: number;
  matchScore?: number;
  estimatedTimeMinutes?: number;
}

interface RecipeCardsProps {
  recipes?: Recipe[] | RecipeSuggestion[] | RecipeResponse | string | Record<string, unknown>;
  loading?: boolean;
}

export default function RecipeCards({ recipes, loading }: RecipeCardsProps) {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const parsedRecipes = parseRecipes(recipes);

  const difficultyColors: Record<string, string> = {
    'Easy': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Hard': 'bg-red-500/20 text-red-400 border-red-500/30',
    'beginner': 'bg-green-500/20 text-green-400 border-green-500/30',
    'intermediate': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'advanced': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <div className="bg-[#2a2520] border border-[#d4a574]/20 rounded-2xl p-6 h-full">
      <h2 className="text-lg font-semibold text-[#d4a574] mb-4 flex items-center gap-2">
        👨‍🍳 Suggested Recipes
        {parsedRecipes.length > 0 && (
          <span className="text-xs bg-[#d4a574]/20 px-2 py-0.5 rounded-full">
            {parsedRecipes.length} recipes
          </span>
        )}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-3 h-3 bg-[#d4a574] rounded-full"
              />
            ))}
          </div>
        </div>
      ) : parsedRecipes.length === 0 ? (
        <div className="text-center py-12 text-[#8b7355]">
          <span className="text-4xl mb-3 block">👨‍🍳</span>
          <p>No recipes yet</p>
          <p className="text-xs mt-1">Generate a meal plan to see suggestions</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {parsedRecipes.map((recipe, idx) => {
            const recipeId = recipe.id || `recipe-${idx}`;
            const isExpanded = expandedRecipe === recipeId;
            const displayName = recipe.name || recipe.title || 'Untitled Recipe';
            const displayTime = recipe.cookTime || recipe.estimatedTimeMinutes;
            const displaySteps = recipe.instructions || recipe.steps || [];
            
            return (
              <motion.div
                key={recipeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#1a1916] border border-[#8b7355]/30 rounded-xl overflow-hidden hover:border-[#d4a574]/50 transition-colors"
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRecipe(isExpanded ? null : recipeId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#f5e6d3] truncate">{displayName}</h3>
                      {recipe.description && (
                        <p className="text-sm text-[#8b7355] mt-1 line-clamp-2">{recipe.description}</p>
                      )}
                    </div>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="text-[#8b7355] flex-shrink-0"
                    >
                      ▼
                    </motion.span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {displayTime && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-[#2a2520] rounded-full text-[#8b7355]">
                        ⏱️ {displayTime} {typeof displayTime === 'number' ? 'min' : ''}
                      </span>
                    )}
                    {recipe.difficulty && (
                      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${difficultyColors[recipe.difficulty] || difficultyColors['Medium']}`}>
                        {recipe.difficulty}
                      </span>
                    )}
                    {recipe.matchScore && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-[#d4a574]/20 rounded-full text-[#d4a574]">
                        ✓ {recipe.matchScore}% match
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <motion.div
                  initial={false}
                  animate={{ 
                    height: isExpanded ? 'auto' : 0,
                    opacity: isExpanded ? 1 : 0
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-[#8b7355]/20 pt-4">
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-[#d4a574] mb-2">Ingredients</h4>
                        <ul className="text-sm text-[#8b7355] space-y-1">
                          {recipe.ingredients.slice(0, 6).map((ing, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#d4a574]">•</span>
                              {ing}
                            </li>
                          ))}
                          {recipe.ingredients.length > 6 && (
                            <li className="text-xs text-[#8b7355]/60">
                              +{recipe.ingredients.length - 6} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {displaySteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-[#d4a574] mb-2">Instructions</h4>
                        <ol className="text-sm text-[#8b7355] space-y-2">
                          {displaySteps.slice(0, 4).map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#d4a574] font-medium">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                          {displaySteps.length > 4 && (
                            <li className="text-xs text-[#8b7355]/60">
                              +{displaySteps.length - 4} more steps...
                            </li>
                          )}
                        </ol>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #8b7355;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4a574;
        }
      `}</style>
    </div>
  );
}

function parseRecipes(recipes: Recipe[] | RecipeSuggestion[] | RecipeResponse | string | Record<string, unknown> | undefined): Recipe[] {
  if (!recipes) return [];
  
  // Already an array
  if (Array.isArray(recipes)) {
    return recipes.map(r => {
      if (typeof r === 'string') {
        return { name: r };
      }
      // Handle RecipeSuggestion type (from RecipeResponse)
      const recipe = r as Recipe | RecipeSuggestion;
      return {
        id: (recipe as Recipe).id,
        name: (recipe as Recipe).name || (recipe as RecipeSuggestion).title || 'Untitled',
        title: (recipe as RecipeSuggestion).title,
        description: (recipe as Recipe).description,
        cookTime: (recipe as Recipe).cookTime || (recipe as RecipeSuggestion).estimatedTimeMinutes,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients,
        instructions: (recipe as Recipe).instructions,
        steps: (recipe as RecipeSuggestion).steps,
        servings: (recipe as Recipe).servings,
        matchScore: (recipe as Recipe).matchScore,
        estimatedTimeMinutes: (recipe as RecipeSuggestion).estimatedTimeMinutes
      };
    });
  }
  
  // String format
  if (typeof recipes === 'string') {
    try {
      const parsed = JSON.parse(recipes);
      return parseRecipes(parsed);
    } catch {
      return [];
    }
  }
  
  // Object with recipes array (RecipeResponse format)
  if (typeof recipes === 'object') {
    if ('recipes' in recipes && Array.isArray((recipes as RecipeResponse).recipes)) {
      return parseRecipes((recipes as RecipeResponse).recipes);
    }
    if ('items' in recipes && Array.isArray((recipes as Record<string, unknown>).items)) {
      return parseRecipes((recipes as Record<string, unknown>).items as Recipe[]);
    }
    // Single recipe object
    if ('name' in recipes || 'title' in recipes) {
      return [recipes as unknown as Recipe];
    }
  }
  
  return [];
}
