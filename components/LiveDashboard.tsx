'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { fileToBase64 } from '@/lib/kestraService';
import InventoryDisplay from './InventoryDisplay';
import RecipeCards from './RecipeCards';
import ShoppingListPanel from './ShoppingListPanel';

interface LiveDashboardProps {
  userId: string;
}

type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export default function LiveDashboard({ userId }: LiveDashboardProps) {
  const { data, loading: dataLoading, error } = useFirebaseRealtime(userId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<{
    skillLevel: SkillLevel;
    availableTime: number;
    dietaryRestriction: string;
    allergies: string;
  }>({
    skillLevel: 'beginner',
    availableTime: 30,
    dietaryRestriction: 'None',
    allergies: 'None'
  });

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }, []);

  const handleGeneratePlan = async () => {
    setIsProcessing(true);
    setProcessingStep('Analyzing your fridge...');

    try {
      let fridgeImageBase64 = '';
      
      if (selectedImage) {
        setProcessingStep('Converting image...');
        fridgeImageBase64 = await fileToBase64(selectedImage);
      }

      setProcessingStep('🤖 Chef AI is scanning your ingredients...');
      
      // Call Next.js API route (server-side) to avoid CORS
      const response = await fetch('/api/kestra/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fridgeImage: fridgeImageBase64,
          skillLevel: preferences.skillLevel,
          availableTime: preferences.availableTime,
          dietaryRestriction: preferences.dietaryRestriction,
          allergies: preferences.allergies
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger pipeline');
      }

      // Pipeline triggered - results will come via Firebase real-time listeners
      setProcessingStep('✨ AI is generating your personalized meal plan...');
      
      // Show processing state for a bit, then rely on Firebase updates
      setTimeout(() => {
        setProcessingStep('Waiting for AI results...');
      }, 3000);
      
      // Eventually clear processing (results come via Firebase)
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 30000); // 30 second timeout

    } catch (err) {
      console.error('Error triggering pipeline:', err);
      setProcessingStep('❌ Error: Could not connect to Chef AI');
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 3000);
    }
  };

  // When data arrives from Firebase, stop the processing state
  useEffect(() => {
    if (data && isProcessing && (data.inventory || data.recipes)) {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [data, isProcessing]);

  return (
    <div className="min-h-screen bg-[#1a1916] text-[#f5e6d3]">
      {/* Header */}
      <header className="border-b border-[#d4a574]/20 bg-[#1a1916]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍳</span>
            <div>
              <h1 className="text-xl font-bold text-[#d4a574]">Kitchen OS</h1>
              <p className="text-xs text-[#8b7355]">AI-Powered Smart Fridge</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8b7355]">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            {isProcessing ? 'Processing...' : 'Ready'}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* AI Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#2a2520] border border-[#d4a574]/30 rounded-2xl p-8 max-w-md mx-4 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-6xl"
                  >
                    🍳
                  </motion.div>
                  <motion.div
                    animate={{ y: [-4, 0, -4] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl"
                  >
                    ✨
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-[#d4a574] mb-2">Chef AI is Cooking</h3>
                <p className="text-[#8b7355] mb-4">{processingStep}</p>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="w-3 h-3 bg-[#d4a574] rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload & Preferences Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Upload Card */}
            <div className="bg-[#2a2520] border border-[#d4a574]/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#d4a574] mb-4 flex items-center gap-2">
                📸 Scan Your Fridge
              </h2>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${imagePreview 
                    ? 'border-[#d4a574]/50 bg-[#d4a574]/5' 
                    : 'border-[#8b7355]/30 hover:border-[#d4a574]/50 hover:bg-[#d4a574]/5'
                  }
                `}>
                  {imagePreview ? (
                    <div>
                      <img 
                        src={imagePreview} 
                        alt="Fridge preview" 
                        className="max-h-32 mx-auto rounded-lg mb-3"
                      />
                      <p className="text-sm text-[#8b7355]">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl mb-3 block">📷</span>
                      <p className="text-[#8b7355]">Click or drag to upload fridge photo</p>
                      <p className="text-xs text-[#8b7355]/60 mt-1">AI will detect ingredients</p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Preferences Card */}
            <div className="bg-[#2a2520] border border-[#d4a574]/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#d4a574] mb-4 flex items-center gap-2">
                ⚙️ Your Preferences
              </h2>
                <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#8b7355] block mb-1">Skill Level</label>
                  <select
                    value={preferences.skillLevel}
                    onChange={(e) => setPreferences(p => ({ ...p, skillLevel: e.target.value as SkillLevel }))}
                    className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-3 py-2 text-[#f5e6d3] focus:border-[#d4a574] focus:outline-none"
                  >
                    <option value="beginner">🍳 Beginner</option>
                    <option value="intermediate">👨‍🍳 Intermediate</option>
                    <option value="advanced">⭐ Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#8b7355] block mb-1">Time Available: {preferences.availableTime} min</label>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={preferences.availableTime}
                    onChange={(e) => setPreferences(p => ({ ...p, availableTime: parseInt(e.target.value) }))}
                    className="w-full accent-[#d4a574]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#8b7355] block mb-1">Dietary Restrictions</label>
                  <input
                    type="text"
                    value={preferences.dietaryRestriction}
                    onChange={(e) => setPreferences(p => ({ ...p, dietaryRestriction: e.target.value }))}
                    placeholder="e.g., Vegetarian, Vegan, Keto"
                    className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-3 py-2 text-[#f5e6d3] placeholder:text-[#8b7355]/50 focus:border-[#d4a574] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            onClick={handleGeneratePlan}
            disabled={isProcessing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg
              flex items-center justify-center gap-3 transition-all
              ${isProcessing 
                ? 'bg-[#8b7355]/50 cursor-not-allowed text-[#f5e6d3]/50' 
                : 'bg-gradient-to-r from-[#d4a574] to-[#c49464] text-[#1a1916] hover:shadow-lg hover:shadow-[#d4a574]/20'
              }
            `}
          >
            {isProcessing ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  🍳
                </motion.span>
                Processing...
              </>
            ) : (
              <>
                🚀 Generate Meal Plan
              </>
            )}
          </motion.button>
        </motion.section>

        {/* Results Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inventory Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <InventoryDisplay 
              inventory={data?.inventory} 
              loading={dataLoading}
            />
          </motion.div>

          {/* Recipes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <RecipeCards 
              recipes={data?.recipes} 
              loading={dataLoading}
            />
          </motion.div>

          {/* Shopping List Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ShoppingListPanel 
              shoppingList={data?.shopping_list}
              userId={userId}
              loading={dataLoading}
            />
          </motion.div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d4a574]/10 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-[#8b7355] text-sm">
          <p>Powered by <span className="text-[#d4a574]">Kestra AI Workflows</span> + <span className="text-[#d4a574]">Firebase Realtime</span></p>
        </div>
      </footer>
    </div>
  );
}
