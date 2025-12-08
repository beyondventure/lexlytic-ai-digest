-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-docs', 'compliance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to compliance-docs bucket
CREATE POLICY "Users can upload compliance documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'compliance-docs');

-- Allow users to read their uploaded documents
CREATE POLICY "Users can read compliance documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'compliance-docs');

-- Allow users to delete their documents
CREATE POLICY "Users can delete compliance documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'compliance-docs');