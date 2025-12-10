"use client";

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';
import type { InventoryItem } from '@/lib/types';

interface UseInventoryResult {
  items: InventoryItem[];
  loading: boolean;
  error: Error | null;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useInventory(uid: string | undefined | null): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!!uid);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    const db = getFirebaseDatabase();
    const itemsRef = ref(db, `users/${uid}/inventory/items`);

    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        const value = snapshot.val() as InventoryItem[] | null;
        setItems(value ?? []);
        setLoading(false);
      },
      (err: unknown) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const persistItems = useCallback(
    async (nextItems: InventoryItem[]) => {
      if (!uid) return;
      const db = getFirebaseDatabase();
      const itemsRef = ref(db, `users/${uid}/inventory/items`);
      await set(itemsRef, nextItems);
    },
    [uid]
  );

  const addItem = useCallback<UseInventoryResult['addItem']>(
    async (item: Omit<InventoryItem, 'id'>) => {
      const id = crypto.randomUUID();
      const nextItems = [...items, { ...item, id }];
      setItems(nextItems);
      await persistItems(nextItems);
    },
    [items, persistItems]
  );

  const updateItem = useCallback<UseInventoryResult['updateItem']>(
    async (item: InventoryItem) => {
      const nextItems = items.map((it: InventoryItem) => (it.id === item.id ? item : it));
      setItems(nextItems);
      await persistItems(nextItems);
    },
    [items, persistItems]
  );

  const deleteItem = useCallback<UseInventoryResult['deleteItem']>(
    async (id: string) => {
      const nextItems = items.filter((it: InventoryItem) => it.id !== id);
      setItems(nextItems);
      await persistItems(nextItems);
    },
    [items, persistItems]
  );

  return { items, loading, error, addItem, updateItem, deleteItem };
}
