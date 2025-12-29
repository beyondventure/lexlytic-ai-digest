-- Add storage_path column to african_law_resources table
ALTER TABLE public.african_law_resources 
ADD COLUMN IF NOT EXISTS storage_path TEXT;