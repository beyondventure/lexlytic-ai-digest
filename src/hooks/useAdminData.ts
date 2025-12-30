import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalLegalDocuments: number;
  totalReports: number;
  totalAlerts: number;
  totalConversations: number;
  totalMessages: number;
  totalWorkspaces: number;
  totalSupportTickets: number;
  unreadSupportTickets: number;
  totalTranslations: number;
  totalAlertSubscriptions: number;
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

export interface PlatformAnalytics {
  documentsOverTime: { date: string; count: number; type: string }[];
  userGrowth: { date: string; count: number }[];
  featureUsage: { feature: string; count: number }[];
  jurisdictionBreakdown: { jurisdiction: string; count: number }[];
  riskDistribution: { level: string; count: number }[];
  alertsByJurisdiction: { jurisdiction: string; count: number }[];
  conversationActivity: { date: string; count: number }[];
  reportsByStatus: { status: string; count: number }[];
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
      const [
        { count: docCount },
        { count: legalDocCount },
        { count: reportCount },
        { count: alertCount },
        { count: conversationCount },
        { count: profileCount },
        { count: messageCount },
        { count: workspaceCount },
        { count: supportCount },
        { count: unreadSupportCount },
        { count: alertSubCount },
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('legal_documents').select('*', { count: 'exact', head: true }),
        supabase.from('due_diligence_reports').select('*', { count: 'exact', head: true }),
        supabase.from('alerts').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('workspaces').select('*', { count: 'exact', head: true }),
        supabase.from('support_messages').select('*', { count: 'exact', head: true }),
        supabase.from('support_messages').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('is_from_admin', false),
        supabase.from('alert_subscriptions').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: profileCount || 0,
        activeUsers: profileCount || 0,
        totalDocuments: docCount || 0,
        totalLegalDocuments: legalDocCount || 0,
        totalReports: reportCount || 0,
        totalAlerts: alertCount || 0,
        totalConversations: conversationCount || 0,
        totalMessages: messageCount || 0,
        totalWorkspaces: workspaceCount || 0,
        totalSupportTickets: supportCount || 0,
        unreadSupportTickets: unreadSupportCount || 0,
        totalTranslations: 0,
        totalAlertSubscriptions: alertSubCount || 0,
      };
    },
    enabled: isAdmin,
  });
};

export const usePlatformAnalytics = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['platform_analytics'],
    queryFn: async (): Promise<PlatformAnalytics> => {
      const [
        { data: legalDocs },
        { data: conversations },
        { data: reports },
        { data: regAlerts },
        { data: documents },
      ] = await Promise.all([
        supabase.from('legal_documents').select('jurisdiction, risk_score, status, created_at, document_type'),
        supabase.from('conversations').select('created_at'),
        supabase.from('due_diligence_reports').select('status, overall_risk_score, created_at'),
        supabase.from('regulatory_alerts').select('jurisdiction, severity, created_at'),
        supabase.from('documents').select('document_type, status, created_at'),
      ]);

      // Documents over time (last 30 days)
      const documentsOverTime: { date: string; count: number; type: string }[] = [];
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });

      last30Days.forEach(date => {
        const legalCount = legalDocs?.filter(d => d.created_at?.startsWith(date)).length || 0;
        const docCount = documents?.filter(d => d.created_at?.startsWith(date)).length || 0;
        if (legalCount > 0 || docCount > 0) {
          documentsOverTime.push({ date, count: legalCount + docCount, type: 'all' });
        }
      });

      // Jurisdiction breakdown
      const jurisdictionMap: Record<string, number> = {};
      legalDocs?.forEach(doc => {
        if (doc.jurisdiction) {
          jurisdictionMap[doc.jurisdiction] = (jurisdictionMap[doc.jurisdiction] || 0) + 1;
        }
      });
      const jurisdictionBreakdown = Object.entries(jurisdictionMap)
        .map(([jurisdiction, count]) => ({ jurisdiction, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Risk distribution
      const riskLevels = { 'Low (0-40)': 0, 'Medium (41-70)': 0, 'High (71-100)': 0 };
      legalDocs?.forEach(doc => {
        if (doc.risk_score !== null) {
          if (doc.risk_score <= 40) riskLevels['Low (0-40)']++;
          else if (doc.risk_score <= 70) riskLevels['Medium (41-70)']++;
          else riskLevels['High (71-100)']++;
        }
      });
      reports?.forEach(report => {
        if (report.overall_risk_score !== null) {
          if (report.overall_risk_score <= 40) riskLevels['Low (0-40)']++;
          else if (report.overall_risk_score <= 70) riskLevels['Medium (41-70)']++;
          else riskLevels['High (71-100)']++;
        }
      });
      const riskDistribution = Object.entries(riskLevels).map(([level, count]) => ({ level, count }));

      // Alerts by jurisdiction
      const alertJurisdictionMap: Record<string, number> = {};
      regAlerts?.forEach(alert => {
        alertJurisdictionMap[alert.jurisdiction] = (alertJurisdictionMap[alert.jurisdiction] || 0) + 1;
      });
      const alertsByJurisdiction = Object.entries(alertJurisdictionMap)
        .map(([jurisdiction, count]) => ({ jurisdiction, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Conversation activity
      const conversationActivity: { date: string; count: number }[] = [];
      last30Days.forEach(date => {
        const count = conversations?.filter(c => c.created_at?.startsWith(date)).length || 0;
        if (count > 0) {
          conversationActivity.push({ date, count });
        }
      });

      // Feature usage approximation
      const featureUsage = [
        { feature: 'Document Upload', count: (legalDocs?.length || 0) },
        { feature: 'AI Chat', count: (conversations?.length || 0) },
        { feature: 'Due Diligence', count: (reports?.length || 0) },
        { feature: 'Regulatory Alerts', count: (regAlerts?.length || 0) },
        { feature: 'CBN Rulebook', count: (documents?.length || 0) },
      ];

      // Reports by status
      const statusMap: Record<string, number> = {};
      reports?.forEach(r => {
        statusMap[r.status || 'unknown'] = (statusMap[r.status || 'unknown'] || 0) + 1;
      });
      const reportsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

      // User growth (mock based on profiles)
      const userGrowth: { date: string; count: number }[] = [];

      return {
        documentsOverTime,
        userGrowth,
        featureUsage,
        jurisdictionBreakdown,
        riskDistribution,
        alertsByJurisdiction,
        conversationActivity,
        reportsByStatus,
      };
    },
    enabled: isAdmin,
  });
};

export const useAllUsers = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, company, created_at')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: '',
          created_at: profile.created_at,
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
        .select('id, title, created_at, overall_risk_score, user_id, status')
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
      const [{ data: documents }, { data: legalDocs }] = await Promise.all([
        supabase.from('documents').select('document_type, status, created_at'),
        supabase.from('legal_documents').select('document_type, status, created_at, jurisdiction'),
      ]);

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      const byJurisdiction: Record<string, number> = {};

      documents?.forEach(doc => {
        byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
        byStatus[doc.status || 'unknown'] = (byStatus[doc.status || 'unknown'] || 0) + 1;
        
        if (doc.created_at) {
          const month = new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          byMonth[month] = (byMonth[month] || 0) + 1;
        }
      });

      legalDocs?.forEach(doc => {
        const type = doc.document_type || 'Legal Document';
        byType[type] = (byType[type] || 0) + 1;
        byStatus[doc.status || 'unknown'] = (byStatus[doc.status || 'unknown'] || 0) + 1;
        
        if (doc.jurisdiction) {
          byJurisdiction[doc.jurisdiction] = (byJurisdiction[doc.jurisdiction] || 0) + 1;
        }
        
        if (doc.created_at) {
          const month = new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          byMonth[month] = (byMonth[month] || 0) + 1;
        }
      });

      return { 
        byType, 
        byStatus, 
        byMonth, 
        byJurisdiction,
        total: (documents?.length || 0) + (legalDocs?.length || 0) 
      };
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

export const useSupportMessages = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['support_messages_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });
};

export const useSupportMessageReplies = (parentId: string | null) => {
  return useQuery({
    queryKey: ['support_replies', parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!parentId,
  });
};

export const useUserSupportMessages = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user_support_messages', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};