"use client";

import { useState, useEffect } from 'react';
import type { DifficultyLevel, UserPreferences } from '@/lib/types';
import { usePreferences } from '@/lib/hooks/usePreferences';
import { 
  motion, 
  AnimatePresence,
  Button, 
  SelectionCard,
  Tag,
  LoadingDots 
} from '@/components/ui/motion-primitives';

interface PreferencesFormProps {
  uid: string;
}

const SKILL_LEVELS: { value: DifficultyLevel; label: string; icon: string }[] = [
  { value: 'beginner', label: 'Beginner', icon: '🥄' },
  { value: 'intermediate', label: 'Intermediate', icon: '🍳' },
  { value: 'advanced', label: 'Advanced', icon: '👨‍🍳' },
];

const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
  { value: 'none', label: 'None', icon: '✓' },
];

export function PreferencesForm({ uid }: PreferencesFormProps) {
  const { preferences, loading, error, savePreferences } = usePreferences(uid);
  const [local, setLocal] = useState<UserPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (preferences) setLocal(preferences);
  }, [preferences]);

  const handleToggleDiet = (diet: string) => {
    if (!local) return;
    setSaved(false);
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
    setIsSaving(true);
    await savePreferences(local);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading || !local) {
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
          <span>⚠️</span> Error loading preferences
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skill Level */}
      <div>
        <label className="label">Cooking Skill</label>
        <div className="flex gap-3">
          {SKILL_LEVELS.map((level) => (
            <SelectionCard
              key={level.value}
              icon={level.icon}
              label={level.label}
              selected={local.skillLevel === level.value}
              onClick={() => {
                setLocal({ ...local, skillLevel: level.value });
                setSaved(false);
              }}
            />
          ))}
        </div>
      </div>

      {/* Available Time */}
      <div>
        <label className="label">
          Available Time: <span className="text-fresh-400">{local.availableTimeMinutes} minutes</span>
        </label>
        <div className="relative mt-2">
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={local.availableTimeMinutes}
            onChange={(e) => {
              setLocal({ ...local, availableTimeMinutes: Number(e.target.value) });
              setSaved(false);
            }}
            className="w-full h-2 bg-kitchen-elevated rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-md
              [&::-webkit-slider-thumb]:bg-fresh-500
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-fresh-400
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-pixel-sm
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:bg-fresh-400
            "
          />
          {/* Time markers */}
          <div className="flex justify-between mt-2 px-1">
            <span className="text-2xs font-mono text-warm-600">10m</span>
            <span className="text-2xs font-mono text-warm-600">30m</span>
            <span className="text-2xs font-mono text-warm-600">60m</span>
            <span className="text-2xs font-mono text-warm-600">90m</span>
            <span className="text-2xs font-mono text-warm-600">120m</span>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div>
        <label className="label">Dietary Preferences</label>
        <div className="flex flex-wrap gap-2">
          {DIET_OPTIONS.map((diet) => {
            const isSelected = local.dietPreferences.includes(diet.value);
            return (
              <Tag
                key={diet.value}
                variant={isSelected ? 'selected' : 'default'}
                onClick={() => handleToggleDiet(diet.value)}
              >
                <span>{diet.icon}</span>
                <span>{diet.label}</span>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
        >
          Save Preferences
        </Button>
        
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-sm text-fresh-400 flex items-center gap-1"
            >
              <span>✓</span> Saved!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
