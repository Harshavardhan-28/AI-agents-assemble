'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { useFirebaseRealtime } from '@/lib/hooks/useFirebaseRealtime';
import { triggerInventoryFlow, fileToBase64 } from '@/lib/kestraService';

export default function InventoryPage() {
  const { user } = useAuth();
  const { data, loading } = useFirebaseRealtime(user?.uid || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleScan = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      let base64 = '';
      const input = document.querySelector<HTMLInputElement>('input[type="file"]');
      const file = input?.files?.[0];
      
      if (file) {
        base64 = await fileToBase64(file);
      }

      await triggerInventoryFlow(user.uid, base64, manualInput);
      
      // Clear inputs after submission
      setImagePreview(null);
      setManualInput('');
      if (input) input.value = '';
      
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const inventory = data?.inventory || [];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <h2 className="text-lg font-semibold text-[#d4a574] mb-4">📸 Scan Your Fridge</h2>
        
        <label className="block cursor-pointer mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            imagePreview ? 'border-[#d4a574]/50' : 'border-[#8b7355]/30 hover:border-[#d4a574]/40'
          }`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
            ) : (
              <div className="text-[#8b7355]">
                <span className="text-3xl block mb-2">📷</span>
                <span className="text-sm">Tap to upload fridge photo</span>
              </div>
            )}
          </div>
        </label>

        <div className="mb-4">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Or type items: milk, eggs, cheese..."
            className="w-full bg-[#1a1916] border border-[#8b7355]/30 rounded-lg px-4 py-2.5 text-sm text-[#f5e6d3] placeholder:text-[#8b7355]/50 focus:border-[#d4a574] focus:outline-none"
          />
        </div>

        <button
          onClick={handleScan}
          disabled={isProcessing || (!imagePreview && !manualInput)}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            isProcessing || (!imagePreview && !manualInput)
              ? 'bg-[#8b7355]/30 text-[#8b7355] cursor-not-allowed'
              : 'bg-[#d4a574] text-[#1a1916] hover:bg-[#c49464]'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🔄</motion.span>
              Analyzing...
            </span>
          ) : (
            '🚀 Detect Ingredients'
          )}
        </button>
      </div>

      {/* Inventory Display */}
      <div className="bg-[#2a2520] rounded-xl p-5 border border-[#d4a574]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#d4a574]">🧊 Your Inventory</h2>
          {inventory.length > 0 && (
            <span className="text-xs bg-[#d4a574]/20 text-[#d4a574] px-2 py-0.5 rounded-full">
              {inventory.length} items
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-2xl">
              🔄
            </motion.div>
          </div>
        ) : inventory.length === 0 ? (
          <p className="text-center text-[#8b7355] py-8 text-sm">
            No items yet. Scan your fridge to get started!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inventory.map((item, i) => (
              <motion.span
                key={item.id || i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1916] border border-[#8b7355]/30 rounded-full text-sm"
              >
                <span>{item.name}</span>
                {item.quantity && (
                  <span className="text-xs text-[#8b7355]">{item.quantity}</span>
                )}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
