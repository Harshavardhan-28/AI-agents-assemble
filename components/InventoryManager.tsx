"use client";

import { useState, type ChangeEvent } from 'react';
import { useInventory } from '@/lib/hooks/useInventory';
import { 
  motion, 
  AnimatePresence, 
  Button, 
  LoadingDots,
  EmptyState 
} from '@/components/ui/motion-primitives';

interface InventoryManagerProps {
  uid: string;
}

// Food icons based on name
function getFoodIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('milk')) return '🥛';
  if (lower.includes('egg')) return '🥚';
  if (lower.includes('cheese')) return '🧀';
  if (lower.includes('bread')) return '🍞';
  if (lower.includes('apple')) return '🍎';
  if (lower.includes('banana')) return '🍌';
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('carrot')) return '🥕';
  if (lower.includes('chicken')) return '🍗';
  if (lower.includes('fish')) return '🐟';
  if (lower.includes('meat') || lower.includes('beef')) return '🥩';
  if (lower.includes('lettuce') || lower.includes('salad')) return '🥬';
  if (lower.includes('onion')) return '🧅';
  if (lower.includes('potato')) return '🥔';
  if (lower.includes('butter')) return '🧈';
  if (lower.includes('rice')) return '🍚';
  if (lower.includes('pasta') || lower.includes('noodle')) return '🍝';
  return '🥫';
}

export function InventoryManager({ uid }: InventoryManagerProps) {
  const { items, loading, error, addItem, updateItem, deleteItem } = useInventory(uid);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setIsAdding(true);
    await addItem({ name: name.trim(), quantity: quantity || '1', expiryDate: expiryDate || undefined });
    setName('');
    setQuantity('');
    setExpiryDate('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingDots />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-coral-500/10 border border-coral-500/30 rounded-lg">
        <p className="text-sm text-coral-400 flex items-center gap-2">
          <span>⚠️</span> Error loading inventory
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Item Form */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px]">
          <input
            className="input"
            placeholder="Item name..."
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="w-24">
          <input
            className="input"
            placeholder="Qty"
            value={quantity}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="w-40">
          <input
            type="date"
            className="input"
            value={expiryDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setExpiryDate(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAdd}
          loading={isAdding}
          disabled={!name.trim()}
        >
          + Add
        </Button>
      </div>

      {/* Inventory List */}
      {items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No items yet"
          description="Add items to your fridge inventory to get started"
        />
      ) : (
        <div className="inventory-list">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: index * 0.02 }}
                className="inventory-row group"
              >
                {/* Icon */}
                <div className="inventory-row-icon">
                  {getFoodIcon(item.name)}
                </div>
                
                {/* Content - Editable fields */}
                <div className="inventory-row-content flex-1 flex items-center gap-4">
                  <input
                    className="flex-1 bg-transparent border-none text-sm font-medium text-warm-200 focus:outline-none focus:text-warm-50"
                    value={item.name}
                    onChange={(e) => updateItem({ ...item, name: e.target.value })}
                  />
                  <input
                    className="w-16 bg-transparent border-none text-xs font-mono text-warm-500 text-center focus:outline-none focus:text-warm-300"
                    value={item.quantity}
                    onChange={(e) => updateItem({ ...item, quantity: e.target.value })}
                    placeholder="qty"
                  />
                  {item.expiryDate && (
                    <span className="text-2xs font-mono text-warm-600">
                      exp: {item.expiryDate}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="inventory-row-actions">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => item.id && deleteItem(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-coral-500/10 text-coral-400 hover:bg-coral-500/20 transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Item count */}
      {items.length > 0 && (
        <p className="text-xs font-mono text-warm-600 text-right">
          {items.length} item{items.length !== 1 ? 's' : ''} in inventory
        </p>
      )}
    </div>
  );
}
