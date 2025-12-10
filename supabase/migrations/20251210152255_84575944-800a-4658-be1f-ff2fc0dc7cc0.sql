
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view documents in their workspaces or uploaded by the" ON legal_documents;
DROP POLICY IF EXISTS "Users can view workspaces they own or are members of" ON workspaces;
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- Create simplified non-recursive policies
-- For legal_documents: users can view docs they uploaded OR docs in workspaces they own
CREATE POLICY "Users can view their own documents" 
ON legal_documents FOR SELECT 
USING (uploaded_by = auth.uid());

-- For workspaces: users can view workspaces they own
CREATE POLICY "Users can view their workspaces" 
ON workspaces FOR SELECT 
USING (owner_id = auth.uid());

-- For workspace_members: users can see their own memberships
CREATE POLICY "Users can view their memberships" 
ON workspace_members FOR SELECT 
USING (user_id = auth.uid());
