'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { triggerShoppingListFlow } from '@/lib/kestraService';
import { ref, update } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';

export default function ShoppingPage() {
  const { user } = useAuth();
  const { data, loading } = useFirebaseRealtime(user?.uid || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      await triggerShoppingListFlow(user.uid);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
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

  const shoppingList = data?.shopping_list || [];
  const recipesCount = data?.recipes?.recipes?.length || 0;
  const checkedCount = shoppingList.filter((_, i) => checkedItems[i] || shoppingList[i]?.checked).length;
  const progress = shoppingList.length > 0 ? (checkedCount / shoppingList.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Generate Section */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <h2 className="text-lg font-semibold text-[#d4a574] mb-4">🛒 Shopping List</h2>
        
        {recipesCount === 0 ? (
          <p className="text-sm text-[#8b7355] py-4 text-center">
            Generate recipes first to create a shopping list.
          </p>
        ) : (
          <>
            <p className="text-sm text-[#8b7355] mb-4">
              AI compares your inventory against recipe ingredients to find what you need.
            </p>
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
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🔄</motion.span>
                  Analyzing...
                </span>
              ) : (
                '✨ Generate Shopping List'
              )}
            </button>
          </>
        )}
      </div>

      {/* Shopping List Display */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#d4a574]">📝 Items to Buy</h2>
          {shoppingList.length > 0 && (
            <span className="text-xs bg-[#d4a574]/20 text-[#d4a574] px-2 py-0.5 rounded-full">
              {checkedCount}/{shoppingList.length}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {shoppingList.length > 0 && (
          <div className="mb-4">
            <div className="h-1.5 bg-[#1a1916] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#d4a574] rounded-full"
              />
            </div>
            <p className="text-xs text-[#8b7355] mt-1 text-right">
              {checkedCount === shoppingList.length && shoppingList.length > 0
                ? '✅ All done!'
                : `${shoppingList.length - checkedCount} remaining`}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-2xl">
              🔄
            </motion.div>
          </div>
        ) : shoppingList.length === 0 ? (
          <p className="text-center text-[#8b7355] py-8 text-sm">
            No shopping list yet. Generate one based on your recipes!
          </p>
        ) : (
          <div className="space-y-2">
            {shoppingList.map((item, i) => {
              const isChecked = checkedItems[i] ?? item.checked;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggleItem(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#1a1916]/50 border border-[#8b7355]/10'
                      : 'bg-[#1a1916] border border-[#8b7355]/20 hover:border-[#d4a574]/30'
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
        )}
      </div>
    </div>
  );
}
