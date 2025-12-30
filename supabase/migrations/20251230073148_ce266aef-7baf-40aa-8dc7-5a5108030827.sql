-- Create document versions table for version history tracking
CREATE TABLE public.document_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    content_snapshot TEXT,
    summary_snapshot TEXT,
    risk_score_snapshot INTEGER,
    changes_description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their documents
CREATE POLICY "Users can view their document versions"
ON public.document_versions
FOR SELECT
USING (
    document_id IN (
        SELECT id FROM public.legal_documents WHERE uploaded_by = auth.uid()
    )
);

-- Policy: Users can create versions for their documents
CREATE POLICY "Users can create document versions"
ON public.document_versions
FOR INSERT
WITH CHECK (
    document_id IN (
        SELECT id FROM public.legal_documents WHERE uploaded_by = auth.uid()
    )
);

-- Create business units table for risk mapping
CREATE TABLE public.business_units (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    department TEXT,
    owner_name TEXT,
    owner_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

-- Users can manage their own business units
CREATE POLICY "Users can view their business units"
ON public.business_units FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create business units"
ON public.business_units FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their business units"
ON public.business_units FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their business units"
ON public.business_units FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_units_updated_at
BEFORE UPDATE ON public.business_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create document risk assignments table to link documents to business units
CREATE TABLE public.document_risk_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL,
    mitigation_status TEXT DEFAULT 'pending',
    mitigation_notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_risk_assignments ENABLE ROW LEVEL SECURITY;

-- Users can manage assignments for their documents
CREATE POLICY "Users can view their risk assignments"
ON public.document_risk_assignments FOR SELECT
USING (
    document_id IN (
        SELECT id FROM public.legal_documents WHERE uploaded_by = auth.uid()
    )
);

CREATE POLICY "Users can create risk assignments"
ON public.document_risk_assignments FOR INSERT
WITH CHECK (
    document_id IN (
        SELECT id FROM public.legal_documents WHERE uploaded_by = auth.uid()
    )
);

CREATE POLICY "Users can update risk assignments"
ON public.document_risk_assignments FOR UPDATE
USING (
    document_id IN (
        SELECT id FROM public.legal_documents WHERE uploaded_by = auth.uid()
    )
);

CREATE POLICY "Users can delete risk assignments"
ON public.document_risk_assignments FOR DELETE
USING (
    document_id IN (
        SELECT id FROM public.legal_documents WHERE uploaded_by = auth.uid()
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_document_risk_assignments_updated_at
BEFORE UPDATE ON public.document_risk_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create internal policies table for policy integration feature
CREATE TABLE public.internal_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    policy_text TEXT,
    category TEXT,
    effective_date DATE,
    review_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_policies ENABLE ROW LEVEL SECURITY;

-- Users can manage their own policies
CREATE POLICY "Users can view their policies"
ON public.internal_policies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create policies"
ON public.internal_policies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their policies"
ON public.internal_policies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their policies"
ON public.internal_policies FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_internal_policies_updated_at
BEFORE UPDATE ON public.internal_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create policy-regulation mappings table
CREATE TABLE public.policy_regulation_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.internal_policies(id) ON DELETE CASCADE,
    regulation_type TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    compliance_status TEXT DEFAULT 'unknown',
    gap_analysis TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.policy_regulation_mappings ENABLE ROW LEVEL SECURITY;

-- Users can manage mappings for their policies
CREATE POLICY "Users can view their policy mappings"
ON public.policy_regulation_mappings FOR SELECT
USING (
    policy_id IN (
        SELECT id FROM public.internal_policies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create policy mappings"
ON public.policy_regulation_mappings FOR INSERT
WITH CHECK (
    policy_id IN (
        SELECT id FROM public.internal_policies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update policy mappings"
ON public.policy_regulation_mappings FOR UPDATE
USING (
    policy_id IN (
        SELECT id FROM public.internal_policies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete policy mappings"
ON public.policy_regulation_mappings FOR DELETE
USING (
    policy_id IN (
        SELECT id FROM public.internal_policies WHERE user_id = auth.uid()
    )
);