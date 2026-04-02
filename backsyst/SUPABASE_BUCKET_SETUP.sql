-- Supabase Storage Bucket Setup for Lesson Media
-- Paste this SQL into your Supabase SQL Editor

-- 1. Create the lesson-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-media', 'lesson-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to all files in lesson-media bucket
CREATE POLICY "Public Access - Read" ON storage.objects
FOR SELECT
USING (bucket_id = 'lesson-media');

-- 3. Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload - All" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'lesson-media' AND auth.uid() IS NOT NULL);

-- 4. Allow authenticated users to update their files
CREATE POLICY "Authenticated Update - Own" ON storage.objects
FOR UPDATE
USING (bucket_id = 'lesson-media' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'lesson-media' AND auth.uid() IS NOT NULL);

-- 5. Allow authenticated users to delete their files
CREATE POLICY "Authenticated Delete - Own" ON storage.objects
FOR DELETE
USING (bucket_id = 'lesson-media' AND auth.uid() IS NOT NULL);

-- Note: Folders in Supabase Storage don't need to be created explicitly.
-- They're created automatically when you upload files with paths like:
--   videos/filename.mp4
--   images/filename.jpg
--   audio/filename.mp3
