"use client";

import { useState, type ChangeEvent } from 'react';
import type { InventoryItem } from '@/lib/types';
import { useInventory } from '@/lib/hooks/useInventory';

interface InventoryManagerProps {
  uid: string;
}

export function InventoryManager({ uid }: InventoryManagerProps) {
  const { items, loading, error, addItem, updateItem, deleteItem } = useInventory(uid);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addItem({ name: name.trim(), quantity: quantity || '1', expiryDate: expiryDate || undefined });
    setName('');
    setQuantity('');
    setExpiryDate('');
  };

  const handleUpdateField = async (
    item: InventoryItem,
    field: keyof Omit<InventoryItem, 'id'>,
    value: string
  ) => {
    const updated: InventoryItem = { ...item, [field]: value };
    await updateItem(updated);
  };

  if (loading) return <p className="text-sm text-slate-400">Loading inventory...</p>;
  if (error) return <p className="text-sm text-red-400">Error loading inventory.</p>;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Inventory</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        <input
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          placeholder="Item name"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
        <input
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 w-24"
          placeholder="Qty"
          value={quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
        />
        <input
          type="date"
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          value={expiryDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setExpiryDate(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-2 rounded border border-slate-800 bg-slate-900 px-3 py-2"
          >
            <input
              className="rounded bg-slate-950 px-2 py-1 text-xs border border-slate-700"
              value={item.name}
              onChange={(e) => handleUpdateField(item, 'name', e.target.value)}
            />
            <input
              className="w-16 rounded bg-slate-950 px-2 py-1 text-xs border border-slate-700"
              value={item.quantity}
              onChange={(e) => handleUpdateField(item, 'quantity', e.target.value)}
            />
            <input
              type="date"
              className="rounded bg-slate-950 px-2 py-1 text-xs border border-slate-700"
              value={item.expiryDate ?? ''}
              onChange={(e) => handleUpdateField(item, 'expiryDate', e.target.value)}
            />
            <button
              onClick={() => deleteItem(item.id)}
              className="ml-auto rounded bg-red-500 px-2 py-1 text-xs font-semibold text-slate-50 hover:bg-red-400"
            >
              Delete
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs text-slate-500">No items yet. Add what you have in your fridge.</li>
        )}
      </ul>
    </section>
  );
}
