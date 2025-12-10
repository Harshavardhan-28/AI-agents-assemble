"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import type { DifficultyLevel, UserPreferences } from '@/lib/types';
import { usePreferences } from '@/lib/hooks/usePreferences';

interface PreferencesFormProps {
  uid: string;
}

const SKILL_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

const DIET_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'none'];

export function PreferencesForm({ uid }: PreferencesFormProps) {
  const { preferences, loading, error, savePreferences } = usePreferences(uid);
  const [local, setLocal] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (preferences) setLocal(preferences);
  }, [preferences]);

  const handleToggleDiet = (diet: string) => {
    if (!local) return;
    const exists = local.dietPreferences.includes(diet);
    const next = {
      ...local,
      dietPreferences: exists
        ? local.dietPreferences.filter((d: string) => d !== diet)
        : [...local.dietPreferences, diet]
    };
    setLocal(next);
  };

  const handleSave = async () => {
    if (!local) return;
    await savePreferences(local);
  };

  if (loading || !local) return <p className="text-sm text-slate-400">Loading preferences...</p>;
  if (error) return <p className="text-sm text-red-400">Error loading preferences.</p>;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Cooking preferences</h2>
      <div className="space-y-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Skill level</span>
          <select
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={local.skillLevel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setLocal({ ...local, skillLevel: e.target.value as DifficultyLevel })
            }
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Available time (minutes)</span>
          <input
            type="number"
            min={5}
            className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={local.availableTimeMinutes}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLocal({ ...local, availableTimeMinutes: parseInt(e.target.value, 10) || 0 })
            }
          />
        </label>

        <div className="space-y-1">
          <p className="text-xs text-slate-400">Dietary preferences</p>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((diet) => {
              const active = local.dietPreferences.includes(diet) || (diet === 'none' && local.dietPreferences.length === 0);
              return (
                <button
                  key={diet}
                  type="button"
                  onClick={() => handleToggleDiet(diet)}
                  className={`rounded px-2 py-1 text-xs border ${
                    active
                      ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {diet}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-2 rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Save preferences
        </button>
      </div>
    </section>
  );
}
