/*
  # Create storage bucket for landing page images

  1. Storage Bucket
    - `helloneige` - Public bucket for landing page images
      - Public access for reading images
      - Authenticated users can upload
      - File size limit: 10MB
      - Allowed MIME types: image/*

  2. Storage Policies
    - Public can read files
    - Authenticated users can upload files
    - Authenticated users can update/delete their own files
*/

-- Create storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'helloneige',
  'helloneige',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can read files
CREATE POLICY "Public can read helloneige images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'helloneige');

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload to helloneige"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'helloneige');

-- Policy: Authenticated users can update their own files
CREATE POLICY "Authenticated users can update own files in helloneige"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'helloneige')
WITH CHECK (bucket_id = 'helloneige' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Authenticated users can delete their own files
CREATE POLICY "Authenticated users can delete own files in helloneige"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'helloneige' AND (storage.foldername(name))[1] = auth.uid()::text);

