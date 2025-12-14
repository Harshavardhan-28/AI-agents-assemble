'use client';

import { motion } from 'framer-motion';

interface InventoryItem {
  name: string;
  quantity?: string | number;
  unit?: string;
  category?: string;
}

interface InventoryDisplayProps {
  inventory?: InventoryItem[] | string | Record<string, unknown>;
  loading?: boolean;
}

export default function InventoryDisplay({ inventory, loading }: InventoryDisplayProps) {
  // Parse inventory into array format
  const items = parseInventory(inventory);

  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const categoryEmojis: Record<string, string> = {
    'Vegetables': '🥬',
    'Fruits': '🍎',
    'Dairy': '🧀',
    'Meat': '🥩',
    'Seafood': '🐟',
    'Grains': '🌾',
    'Condiments': '🧂',
    'Beverages': '🥤',
    'Other': '📦'
  };

  return (
    <div className="bg-[#2a2520] border border-[#d4a574]/20 rounded-2xl p-6 h-full">
      <h2 className="text-lg font-semibold text-[#d4a574] mb-4 flex items-center gap-2">
        🧊 Your Inventory
        {items.length > 0 && (
          <span className="text-xs bg-[#d4a574]/20 px-2 py-0.5 rounded-full">
            {items.length} items
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
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-[#8b7355]">
          <span className="text-4xl mb-3 block">🧊</span>
          <p>No inventory yet</p>
          <p className="text-xs mt-1">Upload a fridge photo to detect ingredients</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-[#8b7355] mb-2 flex items-center gap-1">
                <span>{categoryEmojis[category] || '📦'}</span>
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {categoryItems.map((item, idx) => (
                  <motion.span
                    key={`${item.name}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1916] border border-[#8b7355]/30 rounded-full text-sm hover:border-[#d4a574]/50 transition-colors cursor-default"
                  >
                    <span className="text-[#f5e6d3]">{item.name}</span>
                    {item.quantity && (
                      <span className="text-xs text-[#8b7355]">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </span>
                    )}
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
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

function parseInventory(inventory: InventoryItem[] | string | Record<string, unknown> | undefined): InventoryItem[] {
  if (!inventory) return [];
  
  // Already an array
  if (Array.isArray(inventory)) {
    return inventory.map(item => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return item;
    });
  }
  
  // String format (from Kestra AI response)
  if (typeof inventory === 'string') {
    try {
      const parsed = JSON.parse(inventory);
      return parseInventory(parsed);
    } catch {
      // Could be comma-separated or newline-separated
      const lines = inventory.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      return lines.map(name => ({ name }));
    }
  }
  
  // Object with items array
  if (typeof inventory === 'object' && 'items' in inventory) {
    return parseInventory(inventory.items as InventoryItem[]);
  }
  
  // Object with inventory array
  if (typeof inventory === 'object' && 'inventory' in inventory) {
    return parseInventory(inventory.inventory as InventoryItem[]);
  }
  
  return [];
}
