import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Document {
  id: string;
  title: string;
  reference_number: string | null;
  document_type: string;
  category: string[] | null;
  issue_date: string | null;
  effective_date: string | null;
  status: string;
  summary: string | null;
  full_text: string | null;
  pdf_url: string | null;
  source_url: string | null;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export const useDocuments = (filters?: {
  documentType?: string;
  category?: string;
  search?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .order("issue_date", { ascending: false });

      if (filters?.documentType) {
        query = query.eq("document_type", filters.documentType);
      }

      if (filters?.category) {
        query = query.contains("category", [filters.category]);
      }

      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Document[];
    },
  });
};

export const useRecentDocuments = (limit = 5) => {
  return useDocuments({ limit });
};
