"use client";

import { useState, type ChangeEvent } from 'react';

interface UploadedImageMeta {
  id: string;
  name: string;
  url: string;
}

export function FridgeImageUploader() {
  const [images, setImages] = useState<UploadedImageMeta[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const next: UploadedImageMeta[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files.item(i);
      if (!file) continue;
      // TODO: Upload image to cloud storage and store URL + metadata in Realtime Database.
      next.push({ id: `${file.name}-${i}`, name: file.name, url: URL.createObjectURL(file) });
    }
    setImages((prev: UploadedImageMeta[]) => [...prev, ...next]);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Fridge photos (optional)</h2>
      <p className="text-xs text-slate-400">
        Upload photos of your fridge or pantry. In a future iteration, a vision
        model / Kestra agent will analyze these to auto-populate your inventory.
      </p>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="text-xs text-slate-300"
      />
      <div className="flex flex-wrap gap-2">
        {images.map((img: UploadedImageMeta) => (
          <figure key={img.id} className="w-24 text-[10px] text-slate-400">
            {/* In production, use next/image and a persisted URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.name}
              className="h-20 w-24 rounded border border-slate-800 object-cover"
            />
            <figcaption className="truncate">{img.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
