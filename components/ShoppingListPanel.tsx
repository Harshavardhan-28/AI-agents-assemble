'use client';

import { motion } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';
import { useState } from 'react';

interface ShoppingItem {
  id?: string;
  name: string;
  quantity?: string | number;
  unit?: string;
  checked?: boolean;
  category?: string;
  forRecipe?: string;
}

interface ShoppingListPanelProps {
  shoppingList?: ShoppingItem[] | string | Record<string, unknown>;
  userId: string;
  loading?: boolean;
}

export default function ShoppingListPanel({ shoppingList, userId, loading }: ShoppingListPanelProps) {
  const items = parseShoppingList(shoppingList);
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});

  const toggleItem = async (item: ShoppingItem, index: number) => {
    const itemId = item.id || `item-${index}`;
    const newChecked = !isChecked(item, index);
    
    // Optimistic update
    setLocalChecked(prev => ({ ...prev, [itemId]: newChecked }));
    
    // Update Firebase
    try {
      const db = getFirebaseDatabase();
      const itemRef = ref(db, `users/${userId}/shopping_list/${index}`);
      await update(itemRef, { checked: newChecked });
    } catch (error) {
      console.error('Error updating shopping item:', error);
      // Revert on error
      setLocalChecked(prev => ({ ...prev, [itemId]: !newChecked }));
    }
  };

  const isChecked = (item: ShoppingItem, index: number): boolean => {
    const itemId = item.id || `item-${index}`;
    if (itemId in localChecked) {
      return localChecked[itemId];
    }
    return item.checked || false;
  };

  const checkedCount = items.filter((item, idx) => isChecked(item, idx)).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  const categoryEmojis: Record<string, string> = {
    'Produce': '🥬',
    'Vegetables': '🥕',
    'Fruits': '🍎',
    'Dairy': '🥛',
    'Meat': '🥩',
    'Seafood': '🐟',
    'Pantry': '🥫',
    'Spices': '🧂',
    'Other': '📦'
  };

  return (
    <div className="bg-[#2a2520] border border-[#d4a574]/20 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#d4a574] flex items-center gap-2">
          🛒 Shopping List
          {items.length > 0 && (
            <span className="text-xs bg-[#d4a574]/20 px-2 py-0.5 rounded-full">
              {checkedCount}/{items.length}
            </span>
          )}
        </h2>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-[#1a1916] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#d4a574] to-[#c49464] rounded-full"
            />
          </div>
          <p className="text-xs text-[#8b7355] mt-1 text-right">
            {checkedCount === items.length && items.length > 0 
              ? '✅ All done!' 
              : `${items.length - checkedCount} items remaining`
            }
          </p>
        </div>
      )}

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
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-[#8b7355]">
          <span className="text-4xl mb-3 block">🛒</span>
          <p>No shopping list yet</p>
          <p className="text-xs mt-1">AI will suggest items based on recipes</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item, idx) => {
            const checked = isChecked(item, idx);
            
            return (
              <motion.div
                key={item.id || `item-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleItem(item, idx)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${checked 
                    ? 'bg-[#1a1916]/50 border border-[#8b7355]/20' 
                    : 'bg-[#1a1916] border border-[#8b7355]/30 hover:border-[#d4a574]/50'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0
                  ${checked 
                    ? 'bg-[#d4a574] border-[#d4a574]' 
                    : 'border-[#8b7355]/50 hover:border-[#d4a574]'
                  }
                `}>
                  {checked && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[#1a1916] text-xs font-bold"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <span className={`
                    block transition-all
                    ${checked ? 'line-through text-[#8b7355]/50' : 'text-[#f5e6d3]'}
                  `}>
                    {categoryEmojis[item.category || 'Other'] || '📦'} {item.name}
                  </span>
                  {item.forRecipe && (
                    <span className="text-xs text-[#8b7355]/60">
                      For: {item.forRecipe}
                    </span>
                  )}
                </div>

                {/* Quantity */}
                {item.quantity && (
                  <span className={`
                    text-sm flex-shrink-0 transition-all
                    ${checked ? 'text-[#8b7355]/30' : 'text-[#8b7355]'}
                  `}>
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                )}
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

function parseShoppingList(list: ShoppingItem[] | string | Record<string, unknown> | undefined): ShoppingItem[] {
  if (!list) return [];
  
  // Already an array
  if (Array.isArray(list)) {
    return list.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `item-${idx}`, name: item, checked: false };
      }
      return { ...item, id: item.id || `item-${idx}` };
    });
  }
  
  // String format
  if (typeof list === 'string') {
    try {
      const parsed = JSON.parse(list);
      return parseShoppingList(parsed);
    } catch {
      // Could be comma or newline separated
      const items = list.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      return items.map((name, idx) => ({ id: `item-${idx}`, name, checked: false }));
    }
  }
  
  // Object with items/shopping_list array
  if (typeof list === 'object') {
    if ('items' in list && Array.isArray(list.items)) {
      return parseShoppingList(list.items as ShoppingItem[]);
    }
    if ('shopping_list' in list && Array.isArray(list.shopping_list)) {
      return parseShoppingList(list.shopping_list as ShoppingItem[]);
    }
    if ('shoppingList' in list && Array.isArray(list.shoppingList)) {
      return parseShoppingList(list.shoppingList as ShoppingItem[]);
    }
  }
  
  return [];
}
