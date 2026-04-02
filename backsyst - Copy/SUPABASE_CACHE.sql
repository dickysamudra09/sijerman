-- ============================================
-- AI FEEDBACK CACHE TABLE - COPY & PASTE THIS
-- ============================================
-- Paste this directly into Supabase SQL Editor
-- https://app.supabase.com/project/[YOUR-PROJECT]/sql

CREATE TABLE IF NOT EXISTS public.ai_feedback_cache (
  id BIGSERIAL PRIMARY KEY,
  question_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL,
  feedback_text TEXT NOT NULL,
  explanation TEXT NOT NULL,
  reference_materials JSONB DEFAULT '[]'::jsonb,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(question_id, is_correct),
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_feedback_cache_question ON public.ai_feedback_cache(question_id);
CREATE INDEX idx_ai_feedback_cache_is_correct ON public.ai_feedback_cache(is_correct);
CREATE INDEX idx_ai_feedback_cache_question_correct ON public.ai_feedback_cache(question_id, is_correct);

ALTER TABLE public.ai_feedback_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read cache" 
ON public.ai_feedback_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Allow service role insert" 
ON public.ai_feedback_cache 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service role update" 
ON public.ai_feedback_cache 
FOR UPDATE 
USING (true);
