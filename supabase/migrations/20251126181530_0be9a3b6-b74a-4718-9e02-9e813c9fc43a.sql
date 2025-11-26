-- Create documents table to store CBN circulars and guidelines
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  reference_number TEXT,
  document_type TEXT NOT NULL, -- 'circular', 'guideline', 'framework', 'notice', etc.
  category TEXT[], -- array of categories like 'Payments', 'FX', 'KYC', etc.
  issue_date DATE,
  effective_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'amended', 'repealed'
  summary TEXT,
  full_text TEXT, -- extracted text from PDF
  pdf_url TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster searches
CREATE INDEX idx_documents_title ON public.documents USING gin(to_tsvector('english', title));
CREATE INDEX idx_documents_full_text ON public.documents USING gin(to_tsvector('english', full_text));
CREATE INDEX idx_documents_category ON public.documents USING gin(category);
CREATE INDEX idx_documents_issue_date ON public.documents(issue_date DESC);
CREATE INDEX idx_documents_document_type ON public.documents(document_type);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view documents)
CREATE POLICY "Documents are viewable by everyone"
  ON public.documents
  FOR SELECT
  USING (true);

-- Create alerts table for tracking new/updated documents
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'new', 'updated', 'deadline'
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info', -- 'info', 'important', 'urgent'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Alerts are viewable by everyone"
  ON public.alerts
  FOR SELECT
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();