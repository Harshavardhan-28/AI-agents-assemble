'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ProcessingType = 'inventory' | 'recipes' | 'shopping' | null;

interface ProcessingContextType {
  processingType: ProcessingType;
  processingMessage: string;
  startProcessing: (type: ProcessingType, message: string) => void;
  stopProcessing: () => void;
  isProcessing: (type?: ProcessingType) => boolean;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingType, setProcessingType] = useState<ProcessingType>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  const startProcessing = useCallback((type: ProcessingType, message: string) => {
    setProcessingType(type);
    setProcessingMessage(message);
  }, []);

  const stopProcessing = useCallback(() => {
    setProcessingType(null);
    setProcessingMessage('');
  }, []);

  const isProcessing = useCallback((type?: ProcessingType) => {
    if (type) return processingType === type;
    return processingType !== null;
  }, [processingType]);

  return (
    <ProcessingContext.Provider value={{ processingType, processingMessage, startProcessing, stopProcessing, isProcessing }}>
      {children}
      
      {/* Global Processing Overlay */}
      <AnimatePresence>
        {processingType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#2a2520] rounded-2xl p-8 border border-[#d4a574]/30 max-w-sm w-full mx-4 text-center shadow-2xl"
            >
              {/* Animated Icon */}
              <div className="mb-6">
                {processingType === 'inventory' && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl"
                  >
                    🧊
                  </motion.div>
                )}
                {processingType === 'recipes' && (
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="text-6xl inline-block"
                  >
                    🍳
                  </motion.div>
                )}
                {processingType === 'shopping' && (
                  <motion.div
                    animate={{ 
                      x: [-10, 10, -10],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-6xl"
                  >
                    🛒
                  </motion.div>
                )}
              </div>

              {/* Message */}
              <h3 className="text-xl font-semibold text-[#d4a574] mb-2">
                {processingType === 'inventory' && 'Analyzing Inventory'}
                {processingType === 'recipes' && 'Generating Recipes'}
                {processingType === 'shopping' && 'Creating Shopping List'}
              </h3>
              <p className="text-[#8b7355] text-sm mb-6">{processingMessage}</p>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-3 h-3 bg-[#d4a574] rounded-full"
                  />
                ))}
              </div>

              {/* Status Text */}
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs text-[#8b7355]/70 mt-4"
              >
                AI agents are working on your request...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}
