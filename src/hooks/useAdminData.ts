import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalReports: number;
  totalAlerts: number;
  totalConversations: number;
}

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string | null;
  profile: {
    full_name: string | null;
    company: string | null;
  } | null;
}

export interface RecentActivity {
  id: string;
  type: 'document' | 'report' | 'alert' | 'conversation';
  title: string;
  created_at: string;
  user_id?: string;
}

export const useIsAdmin = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['is_admin', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return !!data;
    },
    enabled: !!userId,
  });
};

export const useAdminStats = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Get counts from various tables
      const [
        { count: docCount },
        { count: reportCount },
        { count: alertCount },
        { count: conversationCount },
        { count: profileCount },
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('due_diligence_reports').select('*', { count: 'exact', head: true }),
        supabase.from('alerts').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: profileCount || 0,
        activeUsers: profileCount || 0, // Simplified
        totalDocuments: docCount || 0,
        totalReports: reportCount || 0,
        totalAlerts: alertCount || 0,
        totalConversations: conversationCount || 0,
      };
    },
    enabled: isAdmin,
  });
};

export const useAllUsers = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, company')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: '', // Will be populated separately if needed
          profile: {
            full_name: profile.full_name,
            company: profile.company,
          },
          role: userRole?.role || 'viewer',
        };
      }) || [];

      return usersWithRoles;
    },
    enabled: isAdmin,
  });
};

export const useRecentReports = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['recent_reports_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('due_diligence_reports')
        .select('id, title, created_at, overall_risk_score, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });
};

export const useRecentAlerts = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['recent_alerts_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, message, severity, created_at, alert_type')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });
};

export const useDocumentStats = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['document_stats_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('document_type, status, created_at');

      if (error) throw error;

      // Group by document type
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byMonth: Record<string, number> = {};

      data?.forEach(doc => {
        byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
        byStatus[doc.status || 'unknown'] = (byStatus[doc.status || 'unknown'] || 0) + 1;
        
        if (doc.created_at) {
          const month = new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          byMonth[month] = (byMonth[month] || 0) + 1;
        }
      });

      return { byType, byStatus, byMonth, total: data?.length || 0 };
    },
    enabled: isAdmin,
  });
};

export const useRegulatoryAlerts = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['regulatory_alerts_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regulatory_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });
};
