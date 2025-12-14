"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/components/ui/motion-primitives';

interface FridgeImageUploaderProps {
  onImageChange: (base64Image: string | null) => void;
}

export function FridgeImageUploader({ onImageChange }: FridgeImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    setIsProcessing(true);
    
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    setIsProcessing(true);
    const newImages: string[] = [];
    
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      const base64 = await processFile(files[i]);
      if (base64) newImages.push(base64);
    }
    
    const allImages = [...images, ...newImages].slice(0, 4);
    setImages(allImages);
    onImageChange(allImages[0] || null);
    setIsProcessing(false);
  }, [images, processFile, onImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImageChange(newImages[0] || null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <motion.label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          borderColor: isDragOver ? 'var(--fresh)' : 'var(--kitchen-border)',
          backgroundColor: isDragOver ? 'rgba(111, 181, 114, 0.1)' : 'var(--kitchen-elevated)',
        }}
        whileHover={{ borderColor: '#4d463e' }}
        className="upload-zone block cursor-pointer"
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-3xl"
              >
                📷
              </motion.div>
              <span className="text-sm text-warm-400">Processing...</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="upload-zone-icon">
                {isDragOver ? '📥' : '📷'}
              </div>
              <div className="upload-zone-text">
                {isDragOver ? 'Drop images here' : 'Click or drag to upload fridge photos'}
              </div>
              <div className="upload-zone-hint">
                JPG, PNG up to 10MB • Max 4 images
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>

      {/* Image Grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <motion.div
                  key={`${index}-${img.slice(-20)}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-kitchen-border group"
                >
                  <img
                    src={img}
                    alt={`Fridge photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Primary indicator */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-fresh-500/90 text-kitchen-bg text-2xs font-mono font-medium rounded">
                      Primary
                    </div>
                  )}
                  {/* Remove button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-kitchen-bg/80 backdrop-blur-sm rounded-md flex items-center justify-center text-warm-400 hover:text-coral-400 hover:bg-kitchen-bg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      removeImage(index);
                    }}
                  >
                    ✕
                  </motion.button>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-kitchen-bg/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </div>
            <p className="text-xs font-mono text-warm-600 mt-3">
              {images.length} image{images.length !== 1 ? 's' : ''} ready for AI analysis
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
