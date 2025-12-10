"use client";

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebaseClient';
import type { UserPreferences } from '@/lib/types';

interface UsePreferencesResult {
  preferences: UserPreferences | null;
  loading: boolean;
  error: Error | null;
  savePreferences: (prefs: UserPreferences) => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  skillLevel: 'beginner',
  availableTimeMinutes: 30,
  dietPreferences: ['vegetarian']
};

export function usePreferences(uid: string | undefined | null): UsePreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(!!uid);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    const db = getFirebaseDatabase();
    const prefsRef = ref(db, `users/${uid}/preferences`);

    const unsubscribe = onValue(
      prefsRef,
      (snapshot) => {
        const value = snapshot.val() as UserPreferences | null;
        setPreferences(value ?? DEFAULT_PREFERENCES);
        setLoading(false);
      },
      (err: unknown) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const savePreferences = useCallback<UsePreferencesResult['savePreferences']>(
    async (prefs: UserPreferences) => {
      if (!uid) return;
      const db = getFirebaseDatabase();
      const prefsRef = ref(db, `users/${uid}/preferences`);
      await set(prefsRef, prefs);
      setPreferences(prefs);
    },
    [uid]
  );

  return { preferences, loading, error, savePreferences };
}
