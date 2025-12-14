'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { useProcessing } from '@/components/ProcessingProvider';
import { ref, update, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';

interface ShoppingItem {
  name: string;
  quantity?: string;
  category?: string;
  checked?: boolean;
  forRecipe?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  produce: { icon: '🥬', label: 'Produce', color: 'bg-green-500/20 border-green-500/30' },
  dairy: { icon: '🥛', label: 'Dairy', color: 'bg-blue-500/20 border-blue-500/30' },
  meat: { icon: '🥩', label: 'Meat & Seafood', color: 'bg-red-500/20 border-red-500/30' },
  pantry: { icon: '🥫', label: 'Pantry', color: 'bg-amber-500/20 border-amber-500/30' },
  frozen: { icon: '🧊', label: 'Frozen', color: 'bg-cyan-500/20 border-cyan-500/30' },
  bakery: { icon: '🍞', label: 'Bakery', color: 'bg-yellow-500/20 border-yellow-500/30' },
  beverages: { icon: '🥤', label: 'Beverages', color: 'bg-purple-500/20 border-purple-500/30' },
  other: { icon: '📦', label: 'Other', color: 'bg-gray-500/20 border-gray-500/30' },
};

export default function ShoppingPage() {
  const { user } = useAuth();
  const { data, loading } = useFirebaseRealtime(user?.uid || null);
  const { startProcessing, stopProcessing, isProcessing } = useProcessing();
  const searchParams = useSearchParams();
  const recipeFilter = searchParams.get('recipe');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const previousShoppingRef = useRef<string | null>(null);

  // Initialize checked state from data
  useEffect(() => {
    if (data?.shopping_list) {
      const checked: Record<number, boolean> = {};
      data.shopping_list.forEach((item: ShoppingItem, i: number) => {
        if (item.checked) checked[i] = true;
      });
      setCheckedItems(checked);
    }
  }, [data?.shopping_list]);

  const handleClearShoppingList = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to clear the shopping list?')) return;
    try {
      const db = getFirebaseDatabase();
      await set(ref(db, `users/${user.uid}/shopping_list`), null);
      setCheckedItems({});
    } catch (err) {
      console.error('Error clearing shopping list:', err);
    }
  };

  // Watch for shopping list changes to detect when Kestra finishes
  useEffect(() => {
    if (isProcessing('shopping') && previousShoppingRef.current !== null) {
      const currentShopping = JSON.stringify(data?.shopping_list || []);
      if (previousShoppingRef.current !== currentShopping) {
        stopProcessing();
        previousShoppingRef.current = null;
      }
    }
  }, [data?.shopping_list, isProcessing, stopProcessing]);

  const handleGenerate = async () => {
    if (!user || isProcessing()) return;
    
    // Capture current shopping list state BEFORE starting processing
    previousShoppingRef.current = JSON.stringify(data?.shopping_list || []);
    
    startProcessing('shopping', 'Comparing your inventory with recipe ingredients...');

    try {
      const response = await fetch('/api/kestra/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger shopping list flow');
      }
      // Don't stop processing - wait for Firebase update
    } catch (err) {
      console.error('Error:', err);
      stopProcessing();
    }
  };

  const toggleItem = async (index: number) => {
    if (!user) return;
    const newChecked = !checkedItems[index];
    setCheckedItems(prev => ({ ...prev, [index]: newChecked }));

    try {
      const db = getFirebaseDatabase();
      const itemRef = ref(db, `users/${user.uid}/shopping_list/${index}`);
      await update(itemRef, { checked: newChecked });
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const rawShoppingList: ShoppingItem[] = data?.shopping_list || [];
  
  // Filter by recipe if query param exists
  const shoppingList = recipeFilter 
    ? rawShoppingList.filter(item => item.forRecipe === recipeFilter)
    : rawShoppingList;

  const recipesCount = data?.recipes?.recipes?.length || 0;
  const checkedCount = shoppingList.filter((item, i) => {
    const originalIndex = rawShoppingList.indexOf(item);
    return checkedItems[originalIndex] || item.checked;
  }).length;
  const progress = shoppingList.length > 0 ? (checkedCount / shoppingList.length) * 100 : 0;

  // Group by category
  const groupedItems = shoppingList.reduce((acc, item, displayIndex) => {
    const category = item.category || 'other';
    const originalIndex = rawShoppingList.indexOf(item);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ ...item, _originalIndex: originalIndex });
    return acc;
  }, {} as Record<string, (ShoppingItem & { _originalIndex: number })[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d4a574]">🛒 Shopping List</h1>
          {recipeFilter && (
            <p className="text-sm text-[#8b7355] mt-1">
              For: <span className="text-[#d4a574]">{recipeFilter}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {shoppingList.length > 0 && (
            <>
              <button
                onClick={handleClearShoppingList}
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm"
              >
                🗑️ Clear All
              </button>
              <span className="text-sm bg-[#d4a574]/20 text-[#d4a574] px-3 py-1 rounded-full">
                {checkedCount}/{shoppingList.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {shoppingList.length > 0 && (
        <div className="bg-[#2a2520] rounded-xl p-4 border border-[#d4a574]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8b7355]">Progress</span>
            <span className="text-sm text-[#d4a574] font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-[#1a1916] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#d4a574] to-[#c49464] rounded-full"
            />
          </div>
          {checkedCount === shoppingList.length && shoppingList.length > 0 && (
            <p className="text-center text-green-400 text-sm mt-2">✅ All items collected!</p>
          )}
        </div>
      )}

      {/* Generate Section - only show if not filtering by recipe */}
      {!recipeFilter && (
        <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
          <h2 className="text-lg font-semibold text-[#d4a574] mb-3">✨ Generate List</h2>
          
          {recipesCount === 0 ? (
            <p className="text-sm text-[#8b7355] py-2 text-center">
              Generate recipes first to create a shopping list.
            </p>
          ) : (
            <>
              <p className="text-sm text-[#8b7355] mb-4">
                AI compares your inventory against recipe ingredients.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isProcessing()}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  isProcessing()
                    ? 'bg-[#8b7355]/30 text-[#8b7355] cursor-not-allowed'
                    : 'bg-[#d4a574] text-[#1a1916] hover:bg-[#c49464]'
                }`}
              >
                {isProcessing('shopping') ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🔄</motion.span>
                    Analyzing...
                  </span>
                ) : (
                  '🔄 Regenerate Shopping List'
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Shopping List by Category */}
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-3xl">🔄</motion.div>
        </div>
      ) : shoppingList.length === 0 ? (
        <div className="bg-[#2a2520] rounded-xl p-8 border border-[#d4a574]/20 text-center">
          <span className="text-4xl block mb-3">🛒</span>
          <p className="text-[#8b7355]">
            {recipeFilter 
              ? `No items found for "${recipeFilter}".`
              : 'No shopping list yet. Generate one based on your recipes!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;
            
            const categoryChecked = items.filter(item => checkedItems[item._originalIndex] || item.checked).length;
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${config.color}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <h3 className="font-semibold text-[#f5e6d3]">{config.label}</h3>
                  </div>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[#8b7355]">
                    {categoryChecked}/{items.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {items.map((item) => {
                    const isChecked = checkedItems[item._originalIndex] ?? item.checked;
                    return (
                      <motion.div
                        key={item._originalIndex}
                        layout
                        onClick={() => toggleItem(item._originalIndex)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#1a1916]/30 opacity-60'
                            : 'bg-[#1a1916]/50 hover:bg-[#1a1916]/70'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isChecked ? 'bg-[#d4a574] border-[#d4a574]' : 'border-[#8b7355]/50'
                        }`}>
                          {isChecked && <span className="text-[#1a1916] text-xs font-bold">✓</span>}
                        </div>
                        <span className={`flex-1 text-sm ${isChecked ? 'line-through text-[#8b7355]/50' : 'text-[#f5e6d3]'}`}>
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className={`text-xs ${isChecked ? 'text-[#8b7355]/30' : 'text-[#8b7355]'}`}>
                            {item.quantity}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          
          {/* Uncategorized items */}
          {groupedItems['other'] === undefined && shoppingList.some(item => !item.category) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-gray-500/20 border-gray-500/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📦</span>
                <h3 className="font-semibold text-[#f5e6d3]">Other</h3>
              </div>
              <div className="space-y-2">
                {shoppingList.filter(item => !item.category).map((item, i) => {
                  const originalIndex = rawShoppingList.indexOf(item);
                  const isChecked = checkedItems[originalIndex] ?? item.checked;
                  return (
                    <motion.div
                      key={originalIndex}
                      layout
                      onClick={() => toggleItem(originalIndex)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isChecked ? 'bg-[#1a1916]/30 opacity-60' : 'bg-[#1a1916]/50 hover:bg-[#1a1916]/70'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isChecked ? 'bg-[#d4a574] border-[#d4a574]' : 'border-[#8b7355]/50'
                      }`}>
                        {isChecked && <span className="text-[#1a1916] text-xs font-bold">✓</span>}
                      </div>
                      <span className={`flex-1 text-sm ${isChecked ? 'line-through text-[#8b7355]/50' : 'text-[#f5e6d3]'}`}>
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className={`text-xs ${isChecked ? 'text-[#8b7355]/30' : 'text-[#8b7355]'}`}>
                          {item.quantity}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
