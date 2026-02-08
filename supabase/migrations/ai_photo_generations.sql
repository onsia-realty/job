-- AI Photo Generations table
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS ai_photo_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  style TEXT NOT NULL CHECK (style IN ('BUSINESS_SUIT', 'ANNOUNCER', 'CASUAL')),
  status TEXT NOT NULL DEFAULT 'GENERATING' CHECK (status IN ('GENERATING', 'COMPLETED', 'FAILED', 'ACCEPTED')),
  error_message TEXT,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for user queries and rate limiting
CREATE INDEX IF NOT EXISTS idx_ai_photo_generations_user_id ON ai_photo_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_photo_generations_created_at ON ai_photo_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_photo_generations_user_date ON ai_photo_generations(user_id, created_at);

-- Enable RLS
ALTER TABLE ai_photo_generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own generations
CREATE POLICY "Users can view own generations"
  ON ai_photo_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (API routes use service role key)
-- No INSERT/UPDATE policies for anon users - handled server-side

-- Create storage bucket for AI photos (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-photos', 'ai-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to AI photos
CREATE POLICY "Public read access for ai-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-photos');

-- Allow service role to upload (no policy needed - service role bypasses RLS)
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own ai-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-photos'
    AND auth.uid() IS NOT NULL
  );
