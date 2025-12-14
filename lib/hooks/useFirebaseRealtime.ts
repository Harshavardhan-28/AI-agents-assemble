"use client";

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, set, push, remove, Database } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';
import type { InventoryItem, RecipeResponse, DifficultyLevel } from '@/lib/types';

// ============================================
// REAL-TIME FIREBASE HOOKS
// Listen to Firebase Realtime Database changes
// ============================================

export interface ShoppingItem {
  name: string;
  quantity?: string;
  category?: string;
  forRecipes?: string[];
  checked?: boolean;
}

// Re-export the data interface for components
export interface UserData {
  inventory?: InventoryItem[];
  recipes?: RecipeResponse;
  shopping_list?: ShoppingItem[];
}

/**
 * Hook to listen to ALL user data in real-time
 * Updates automatically when Kestra flows write to Firebase
 */
export function useFirebaseRealtime(userId: string | null): {
  data: UserData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
} {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let db: Database;
    try {
      db = getFirebaseDatabase();
    } catch {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    const userRef = ref(db, `users/${userId}`);
    
    console.log(`[Firebase] Setting up real-time listener for user: ${userId}`);

    onValue(
      userRef,
      (snapshot) => {
        const rawData = snapshot.val();
        console.log('[Firebase] Real-time update received:', rawData);

        if (rawData) {
          const parsedData: UserData = {};
          
          // Parse inventory
          if (rawData.inventory) {
            parsedData.inventory = parseInventory(rawData.inventory);
          }

          // Parse recipes
          if (rawData.recipes) {
            parsedData.recipes = parseRecipes(rawData.recipes);
          }

          // Parse shopping list
          if (rawData.shopping_list) {
            parsedData.shopping_list = parseShoppingList(rawData.shopping_list);
          }

          setData(parsedData);
        } else {
          setData({});
        }

        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[Firebase] Real-time listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('[Firebase] Cleaning up real-time listener');
      off(userRef);
    };
  }, [userId]);

  return { data, loading, error, refreshData };
}

/**
 * Hook to listen to just inventory in real-time
 */
export function useRealtimeInventory(userId: string | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let db: Database;
    try {
      db = getFirebaseDatabase();
    } catch {
      setLoading(false);
      return;
    }

    const inventoryRef = ref(db, `users/${userId}/inventory`);

    onValue(
      inventoryRef,
      (snapshot) => {
        const data = snapshot.val();
        const inv = parseInventory(data);
        setItems(inv);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => off(inventoryRef);
  }, [userId]);

  // Add item to Firebase
  const addItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    if (!userId) return;
    const db = getFirebaseDatabase();
    const inventoryRef = ref(db, `users/${userId}/inventory`);
    const newRef = push(inventoryRef);
    await set(newRef, { ...item, id: newRef.key });
  }, [userId]);

  // Remove item from Firebase
  const removeItem = useCallback(async (itemId: string) => {
    if (!userId) return;
    const db = getFirebaseDatabase();
    const itemRef = ref(db, `users/${userId}/inventory/${itemId}`);
    await remove(itemRef);
  }, [userId]);

  // Update item in Firebase
  const updateItem = useCallback(async (item: InventoryItem) => {
    if (!userId) return;
    const db = getFirebaseDatabase();
    const itemRef = ref(db, `users/${userId}/inventory/${item.id}`);
    await set(itemRef, item);
  }, [userId]);

  return { items, loading, error, addItem, removeItem, updateItem };
}

/**
 * Hook to listen to recipes in real-time
 */
export function useRealtimeRecipes(userId: string | null) {
  const [recipes, setRecipes] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let db: Database;
    try {
      db = getFirebaseDatabase();
    } catch {
      setLoading(false);
      return;
    }

    const recipesRef = ref(db, `users/${userId}/recipes`);

    onValue(
      recipesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRecipes(parseRecipes(data));
        } else {
          setRecipes(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => off(recipesRef);
  }, [userId]);

  return { recipes, loading, error };
}

/**
 * Hook to listen to shopping list in real-time
 */
export function useRealtimeShoppingList(userId: string | null) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let db: Database;
    try {
      db = getFirebaseDatabase();
    } catch {
      setLoading(false);
      return;
    }

    const shoppingRef = ref(db, `users/${userId}/shopping_list`);

    onValue(
      shoppingRef,
      (snapshot) => {
        const data = snapshot.val();
        setItems(parseShoppingList(data));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => off(shoppingRef);
  }, [userId]);

  // Toggle checked state
  const toggleItem = useCallback(async (index: number) => {
    if (!userId) return;
    const db = getFirebaseDatabase();
    const itemRef = ref(db, `users/${userId}/shopping_list/${index}/checked`);
    const newChecked = !items[index]?.checked;
    await set(itemRef, newChecked);
  }, [userId, items]);

  return { items, loading, error, toggleItem };
}

// ============================================
// PARSER FUNCTIONS
// Handle various data formats from Kestra
// ============================================

function parseInventory(data: unknown): InventoryItem[] {
  if (!data) return [];
  
  // If it's a string, try to parse as JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parseInventory(parsed);
    } catch {
      // If it's comma-separated, split it
      return data.split(',').map((name: string, idx: number) => ({
        id: `item_${idx}`,
        name: name.trim(),
        quantity: '1'
      }));
    }
  }

  // If it's an array
  if (Array.isArray(data)) {
    return data.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `item_${idx}`, name: item, quantity: '1' };
      }
      return {
        id: item.id || `item_${idx}`,
        name: item.name || String(item),
        quantity: item.quantity || '1',
        category: item.category,
        expiryDate: item.expiryDate
      };
    });
  }

  // If it's an object (Firebase-style with keys)
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data as Record<string, unknown>).map(([key, value]) => {
      if (typeof value === 'string') {
        return { id: key, name: value, quantity: '1' };
      }
      const v = value as Record<string, unknown>;
      return {
        id: key,
        name: String(v.name || ''),
        quantity: String(v.quantity || '1'),
        category: v.category as string | undefined,
        expiryDate: v.expiryDate as string | undefined
      };
    });
  }

  return [];
}

function parseRecipes(data: unknown): RecipeResponse {
  if (!data) return { inventorySummary: '', recipes: [], shoppingList: [] };
  
  // If it's a string, parse JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parseRecipes(parsed);
    } catch {
      return { inventorySummary: data, recipes: [], shoppingList: [] };
    }
  }

  const d = data as Record<string, unknown>;
  
  const parseDifficulty = (val: unknown): DifficultyLevel => {
    const str = String(val || 'beginner').toLowerCase();
    if (str === 'beginner' || str === 'easy') return 'beginner';
    if (str === 'intermediate' || str === 'medium') return 'intermediate';
    if (str === 'advanced' || str === 'hard') return 'advanced';
    return 'beginner';
  };
  
  return {
    inventorySummary: String(d.inventorySummary || ''),
    recipes: Array.isArray(d.recipes) ? d.recipes.map((r: Record<string, unknown>) => ({
      title: String(r.title || r.name || 'Untitled'),
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.map(String) : [],
      steps: Array.isArray(r.steps) ? r.steps.map(String) : 
             Array.isArray(r.instructions) ? r.instructions.map(String) : [],
      difficulty: parseDifficulty(r.difficulty),
      estimatedTimeMinutes: Number(r.estimatedTimeMinutes || r.time || 30)
    })) : [],
    shoppingList: Array.isArray(d.shoppingList) ? d.shoppingList.map((item: unknown) => {
      if (typeof item === 'string') return { name: item };
      const i = item as Record<string, unknown>;
      return { name: String(i.name || i), quantity: i.quantity ? String(i.quantity) : undefined };
    }) : []
  };
}

function parseShoppingList(data: unknown): ShoppingItem[] {
  if (!data) return [];
  
  // If it's a string, parse JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parseShoppingList(parsed);
    } catch {
      return data.split(',').map((name: string) => ({ name: name.trim() }));
    }
  }

  // Handle {shoppingList: [...]} wrapper
  if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.shoppingList && Array.isArray(d.shoppingList)) {
      return parseShoppingList(d.shoppingList);
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') {
        return { name: item, checked: false };
      }
      const i = item as Record<string, unknown>;
      return {
        name: String(i.name || i),
        quantity: i.quantity ? String(i.quantity) : undefined,
        category: i.category ? String(i.category) : undefined,
        forRecipes: Array.isArray(i.forRecipes) ? i.forRecipes.map(String) : undefined,
        checked: Boolean(i.checked)
      };
    });
  }

  return [];
}
