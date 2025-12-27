-- Create a table to store crawled African law resources
CREATE TABLE public.african_law_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  source_site TEXT NOT NULL,
  resource_type TEXT,
  jurisdiction TEXT,
  category TEXT,
  crawled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.african_law_resources ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (resources should be publicly accessible)
CREATE POLICY "African law resources are viewable by everyone" 
ON public.african_law_resources 
FOR SELECT 
USING (true);

-- Create policy for service role to insert/update (only edge functions can modify)
CREATE POLICY "Service role can manage resources"
ON public.african_law_resources
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster searches
CREATE INDEX idx_african_law_resources_source ON public.african_law_resources(source_site);
CREATE INDEX idx_african_law_resources_jurisdiction ON public.african_law_resources(jurisdiction);
CREATE INDEX idx_african_law_resources_category ON public.african_law_resources(category);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_african_law_resources_updated_at
BEFORE UPDATE ON public.african_law_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();