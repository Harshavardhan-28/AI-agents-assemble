'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { useProcessing } from '@/components/ProcessingProvider';
import { fileToBase64 } from '@/lib/kestraService';
import { ref, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';
import type { InventoryItem } from '@/lib/types';

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  dairy: { icon: '🥛', label: 'Dairy', color: 'bg-blue-500/20 border-blue-500/30' },
  produce: { icon: '🥬', label: 'Produce', color: 'bg-green-500/20 border-green-500/30' },
  meat: { icon: '🥩', label: 'Meat', color: 'bg-red-500/20 border-red-500/30' },
  pantry: { icon: '🥫', label: 'Pantry', color: 'bg-amber-500/20 border-amber-500/30' },
  frozen: { icon: '🧊', label: 'Frozen', color: 'bg-cyan-500/20 border-cyan-500/30' },
  beverages: { icon: '🥤', label: 'Beverages', color: 'bg-purple-500/20 border-purple-500/30' },
  other: { icon: '📦', label: 'Other', color: 'bg-gray-500/20 border-gray-500/30' },
};

export default function InventoryPage() {
  const { user } = useAuth();
  const { data, loading } = useFirebaseRealtime(user?.uid || null);
  const { startProcessing, stopProcessing, isProcessing } = useProcessing();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number; item: InventoryItem } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<InventoryItem>({ name: '', quantity: '', category: 'other' });
  const previousInventoryRef = useRef<string | null>(null);

  // Watch for inventory changes to detect when Kestra finishes
  useEffect(() => {
    if (isProcessing('inventory') && previousInventoryRef.current !== null) {
      const currentInventory = JSON.stringify(data?.inventory || []);
      if (previousInventoryRef.current !== currentInventory) {
        // Inventory changed while processing - Kestra finished!
        stopProcessing();
        previousInventoryRef.current = null;
      }
    }
  }, [data?.inventory, isProcessing, stopProcessing]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleScan = async () => {
    if (!user || isProcessing()) return;
    
    // Capture current inventory state BEFORE starting processing
    previousInventoryRef.current = JSON.stringify(data?.inventory || []);
    
    startProcessing('inventory', 'Our AI is analyzing your fridge contents...');

    try {
      let base64 = '';
      const input = document.querySelector<HTMLInputElement>('input[type="file"]');
      const file = input?.files?.[0];
      
      if (file) {
        base64 = await fileToBase64(file);
      }

      const response = await fetch('/api/kestra/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          fridgeImage: base64,
          manualInventory: manualInput
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger inventory flow');
      }
      
      setImagePreview(null);
      setManualInput('');
      if (input) input.value = '';
      
      // Don't stop processing here - wait for Firebase update
      
    } catch (err) {
      console.error('Error:', err);
      stopProcessing();
    }
  };

  const saveInventory = async (newInventory: InventoryItem[]) => {
    if (!user) return;
    try {
      const db = getFirebaseDatabase();
      await set(ref(db, `users/${user.uid}/inventory`), newInventory);
    } catch (err) {
      console.error('Error saving inventory:', err);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const inventory = Array.isArray(data?.inventory) ? [...data.inventory] : [];
    inventory.splice(index, 1);
    await saveInventory(inventory);
  };

  const handleClearInventory = async () => {
    if (!confirm('Are you sure you want to clear all items?')) return;
    await saveInventory([]);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    const inventory = Array.isArray(data?.inventory) ? [...data.inventory] : [];
    inventory[editingItem.index] = editingItem.item;
    await saveInventory(inventory);
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!newItem.name) return;
    const inventory = Array.isArray(data?.inventory) ? [...data.inventory] : [];
    inventory.push(newItem);
    await saveInventory(inventory);
    setNewItem({ name: '', quantity: '', category: 'other' });
    setShowAddModal(false);
  };

  const rawInventory = data?.inventory || [];
  const inventory: InventoryItem[] = Array.isArray(rawInventory) ? rawInventory : [];
  
  const groupedInventory = inventory.reduce((acc, item, index) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ ...item, _index: index });
    return acc;
  }, {} as Record<string, (InventoryItem & { _index: number })[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d4a574]">🧊 Inventory</h1>
        <div className="flex items-center gap-2">
          {inventory.length > 0 && (
            <button
              onClick={handleClearInventory}
              className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-all flex items-center gap-2"
            >
              🗑️ Clear All
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#d4a574] text-[#1a1916] rounded-lg font-medium hover:bg-[#c49464] transition-all flex items-center gap-2"
          >
            <span>+</span> Add Item
          </button>
        </div>
      </div>

      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <h2 className="text-lg font-semibold text-[#d4a574] mb-4">📸 Scan Your Fridge</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all h-full flex items-center justify-center ${imagePreview ? 'border-[#d4a574]/50' : 'border-[#8b7355]/30 hover:border-[#d4a574]/40'}`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
              ) : (
                <div className="text-[#8b7355]">
                  <span className="text-3xl block mb-2">📷</span>
                  <span className="text-sm">Upload fridge photo</span>
                </div>
              )}
            </div>
          </label>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type items: milk, eggs, cheese..."
              className="flex-1 bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-3 text-sm text-[#f5e6d3] placeholder:text-[#8b7355]/50 focus:border-[#d4a574] focus:outline-none"
            />
            <button
              onClick={handleScan}
              disabled={isProcessing() || (!imagePreview && !manualInput)}
              className={`py-3 rounded-xl font-medium transition-all ${isProcessing() || (!imagePreview && !manualInput) ? 'bg-[#8b7355]/30 text-[#8b7355] cursor-not-allowed' : 'bg-[#d4a574] text-[#1a1916] hover:bg-[#c49464]'}`}
            >
              {isProcessing('inventory') ? '🔄 Analyzing...' : '🚀 Detect Ingredients'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-3xl">🔄</motion.div>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-[#2a2520] rounded-xl p-8 border border-[#d4a574]/20 text-center">
          <span className="text-4xl block mb-3">🧊</span>
          <p className="text-[#8b7355]">No items yet. Scan your fridge to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
            const items = groupedInventory[category];
            if (!items || items.length === 0) return null;
            return (
              <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 ${config.color}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{config.icon}</span>
                  <h3 className="font-semibold text-[#f5e6d3]">{config.label}</h3>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[#8b7355]">{items.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <motion.div key={item._index} layout className="group relative inline-flex items-center gap-2 px-3 py-2 bg-[#1a1916]/50 border border-white/10 rounded-lg text-sm">
                      <span className="text-[#f5e6d3]">{item.name}</span>
                      {item.quantity && <span className="text-xs text-[#8b7355]">({item.quantity})</span>}
                      <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingItem({ index: item._index, item }); }} className="p-1 hover:bg-white/10 rounded text-xs">✏️</button>
                        <button onClick={(e) => handleDeleteItem(e, item._index)} className="p-1 hover:bg-red-500/20 rounded text-xs">🗑️</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#2a2520] rounded-xl p-6 w-full max-w-md border border-[#d4a574]/20" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#d4a574] mb-4">Edit Item</h3>
              <div className="space-y-4">
                <input type="text" value={editingItem.item.name} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })} placeholder="Item name" className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none" />
                <input type="text" value={editingItem.item.quantity} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, quantity: e.target.value } })} placeholder="Quantity" className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none" />
                <select value={editingItem.item.category} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })} className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (<option key={key} value={key}>{config.icon} {config.label}</option>))}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setEditingItem(null)} className="flex-1 py-2.5 border border-[#8b7355]/30 rounded-lg text-[#8b7355] hover:bg-[#1a1916]">Cancel</button>
                  <button onClick={handleUpdateItem} className="flex-1 py-2.5 bg-[#d4a574] text-[#1a1916] rounded-lg font-medium hover:bg-[#c49464]">Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#2a2520] rounded-xl p-6 w-full max-w-md border border-[#d4a574]/20" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#d4a574] mb-4">Add Item</h3>
              <div className="space-y-4">
                <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none" />
                <input type="text" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} placeholder="Quantity" className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none" />
                <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (<option key={key} value={key}>{config.icon} {config.label}</option>))}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#8b7355]/30 rounded-lg text-[#8b7355] hover:bg-[#1a1916]">Cancel</button>
                  <button onClick={handleAddItem} disabled={!newItem.name} className="flex-1 py-2.5 bg-[#d4a574] text-[#1a1916] rounded-lg font-medium hover:bg-[#c49464] disabled:opacity-50">Add</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
