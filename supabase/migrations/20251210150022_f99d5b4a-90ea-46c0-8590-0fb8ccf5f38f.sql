-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  role TEXT,
  avatar_url TEXT,
  preferred_jurisdictions TEXT[] DEFAULT '{}',
  preferred_sectors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create legal_documents table (different from CBN documents)
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  jurisdiction TEXT,
  document_type TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  summary TEXT,
  key_obligations JSONB DEFAULT '[]',
  key_penalties JSONB DEFAULT '[]',
  key_definitions JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  risk_score INTEGER,
  full_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for AI chat
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'New Conversation',
  document_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert_subscriptions table
CREATE TABLE public.alert_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jurisdictions TEXT[] DEFAULT '{}',
  sectors TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  severity_filter TEXT[] DEFAULT ARRAY['high', 'medium', 'low'],
  frequency TEXT DEFAULT 'realtime' CHECK (frequency IN ('realtime', 'daily', 'weekly', 'monthly')),
  email_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create regulatory_alerts table (global alerts, not just CBN)
CREATE TABLE public.regulatory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  jurisdiction TEXT NOT NULL,
  sector TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  source_url TEXT,
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they own or are members of" ON public.workspaces FOR SELECT 
  USING (owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their workspaces" ON public.workspaces FOR DELETE USING (auth.uid() = owner_id);

-- Workspace members policies
CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT 
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Workspace owners can manage members" ON public.workspace_members FOR ALL 
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));

-- Legal documents policies
CREATE POLICY "Users can view documents in their workspaces or uploaded by them" ON public.legal_documents FOR SELECT 
  USING (uploaded_by = auth.uid() OR workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can upload documents" ON public.legal_documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update their documents" ON public.legal_documents FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete their documents" ON public.legal_documents FOR DELETE USING (auth.uid() = uploaded_by);

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT 
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can create messages in their conversations" ON public.messages FOR INSERT 
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Alert subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.alert_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON public.alert_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their subscriptions" ON public.alert_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their subscriptions" ON public.alert_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Regulatory alerts are public (read-only)
CREATE POLICY "Regulatory alerts are viewable by everyone" ON public.regulatory_alerts FOR SELECT USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  -- Create a default workspace for the user
  INSERT INTO public.workspaces (name, owner_id, description)
  VALUES ('My Workspace', new.id, 'Your personal workspace');
  
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alert_subscriptions_updated_at BEFORE UPDATE ON public.alert_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();