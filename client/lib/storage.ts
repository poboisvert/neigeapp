"use client";

import { supabase } from "./auth";
import { supabaseAdmin } from "./supabase-admin";

const BUCKET_NAME = "helloneige";

/**
 * Upload an image file to Supabase storage (admin - uses service role)
 * @param file - The file to upload
 * @param path - Optional path within the bucket (defaults to user's folder)
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, path?: string): Promise<string> {
  // Get user from regular client for user ID
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to upload images");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;
  const filePath = path || `${user.id}/${fileName}`;

  // Upload file using admin client (bypasses RLS)
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete an image from Supabase storage (admin - uses service role)
 * @param path - Path to the file in the bucket
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw error;
  }
}

/**
 * Get public URL for an image
 * @param path - Path to the file in the bucket
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}
