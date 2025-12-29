-- Create storage bucket for regulatory PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('regulatory-pdfs', 'regulatory-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to PDFs
CREATE POLICY "Public can view regulatory PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'regulatory-pdfs');

-- Allow service role to upload PDFs
CREATE POLICY "Service role can upload regulatory PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'regulatory-pdfs');

-- Add column to track internal storage URL
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS storage_path TEXT;