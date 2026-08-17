"use client";

import { supabase, supabaseConfigured } from "./supabase";

export const PHOTOS_BUCKET = "product-photos";

/** Reads a File as a base64 data URL (works fully client-side, no network). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a photo to the `product-photos` Supabase Storage bucket and
 * returns its public URL. Falls back to a base64 data URL (no persistence,
 * no network round trip) when Supabase isn't configured — the vision API
 * accepts data URLs too, so photo analysis keeps working either way.
 */
export async function uploadPhoto(file: File): Promise<string> {
  if (supabase && supabaseConfigured) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (!error) {
      const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
    // Storage upload failed (e.g. bucket/migration not applied yet) — fall
    // back to a data URL so the feature still works.
  }
  return fileToDataUrl(file);
}
