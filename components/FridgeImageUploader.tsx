"use client";

import { useState, useCallback, type ChangeEvent } from 'react';

interface UploadedImageMeta {
  id: string;
  name: string;
  url: string;        // Object URL for preview
  base64: string;     // Base64 encoded data for AI analysis
  size: number;
}

interface FridgeImageUploaderProps {
  onImageChange?: (base64Image: string | null) => void;
  maxSizeMB?: number;
}

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result is: "data:image/jpeg;base64,/9j/4AAQ..."
      // We keep the full data URL as Gemini can handle both formats
      resolve(result);
    };
    reader.onerror = reject;
  });
}

/**
 * Compress image if needed to reduce size for API calls
 */
async function compressImage(file: File, maxSizeMB: number): Promise<string> {
  const base64 = await fileToBase64(file);
  
  // If already small enough, return as-is
  const sizeInMB = (base64.length * 0.75) / (1024 * 1024); // Approximate decoded size
  if (sizeInMB <= maxSizeMB) {
    return base64;
  }

  // Compress using canvas
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calculate new dimensions (max 1920px on longest side)
      const maxDim = 1920;
      let { width, height } = img;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels until under max size
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      while ((result.length * 0.75) / (1024 * 1024) > maxSizeMB && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve(result);
    };
    img.src = base64;
  });
}

export function FridgeImageUploader({ onImageChange, maxSizeMB = 4 }: FridgeImageUploaderProps) {
  const [images, setImages] = useState<UploadedImageMeta[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      const newImages: UploadedImageMeta[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (!file) continue;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} is not an image file`);
          continue;
        }

        // Convert to base64 (with compression if needed)
        const base64 = await compressImage(file, maxSizeMB);
        
        newImages.push({
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name,
          url: URL.createObjectURL(file),
          base64,
          size: base64.length
        });
      }

      setImages(prev => {
        const updated = [...prev, ...newImages];
        // Use the last uploaded image for analysis (or combine multiple)
        if (onImageChange && updated.length > 0) {
          // Send the most recent image
          onImageChange(updated[updated.length - 1].base64);
        }
        return updated;
      });
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [onImageChange, maxSizeMB]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      // Revoke the object URL to free memory
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      // Update parent with new selection
      if (onImageChange) {
        onImageChange(updated.length > 0 ? updated[updated.length - 1].base64 : null);
      }
      return updated;
    });
  }, [onImageChange]);

  const clearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    if (onImageChange) {
      onImageChange(null);
    }
  }, [images, onImageChange]);

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">📷 Fridge/Pantry Photo</h2>
        {images.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear all
          </button>
        )}
      </div>
      
      <p className="text-xs text-slate-400">
        Upload a photo of your fridge or pantry. The Kestra AI Agent will analyze the image 
        using Gemini Vision to automatically identify ingredients, quantities, and freshness.
      </p>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 transition-colors">
          {processing ? 'Processing...' : 'Choose Image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            onChange={handleChange}
            disabled={processing}
            className="hidden"
          />
        </label>
        
        {images.length > 0 && (
          <span className="text-xs text-emerald-400">
            ✓ {images.length} image{images.length > 1 ? 's' : ''} ready for analysis
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <figure 
              key={img.id} 
              className="relative group w-28 text-[10px] text-slate-400"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                className="h-24 w-28 rounded border border-slate-700 object-cover"
              />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                ×
              </button>
              <figcaption className="mt-1 space-y-0.5">
                <p className="truncate font-medium">{img.name}</p>
                <p className="text-slate-500">{formatSize(img.size)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Supported: JPEG, PNG, WebP, HEIC • Max size: {maxSizeMB}MB per image (auto-compressed)
      </p>
    </section>
  );
}
