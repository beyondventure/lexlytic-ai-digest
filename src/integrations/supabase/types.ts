export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      african_law_resources: {
        Row: {
          category: string | null
          crawled_at: string
          description: string | null
          id: string
          jurisdiction: string | null
          resource_type: string | null
          source_site: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          crawled_at?: string
          description?: string | null
          id?: string
          jurisdiction?: string | null
          resource_type?: string | null
          source_site: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          crawled_at?: string
          description?: string | null
          id?: string
          jurisdiction?: string | null
          resource_type?: string | null
          source_site?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      alert_subscriptions: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          frequency: string | null
          id: string
          is_active: boolean | null
          jurisdictions: string[] | null
          keywords: string[] | null
          name: string
          sectors: string[] | null
          severity_filter: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          jurisdictions?: string[] | null
          keywords?: string[] | null
          name: string
          sectors?: string[] | null
          severity_filter?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          jurisdictions?: string[] | null
          keywords?: string[] | null
          name?: string
          sectors?: string[] | null
          severity_filter?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          document_id: string | null
          id: string
          message: string
          severity: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          message: string
          severity?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          message?: string
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          document_ids: string[] | null
          id: string
          title: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          document_ids?: string[] | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          document_ids?: string[] | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string[] | null
          created_at: string | null
          document_type: string
          effective_date: string | null
          full_text: string | null
          id: string
          issue_date: string | null
          pdf_url: string | null
          reference_number: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string[] | null
          created_at?: string | null
          document_type: string
          effective_date?: string | null
          full_text?: string | null
          id?: string
          issue_date?: string | null
          pdf_url?: string | null
          reference_number?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string[] | null
          created_at?: string | null
          document_type?: string
          effective_date?: string | null
          full_text?: string | null
          id?: string
          issue_date?: string | null
          pdf_url?: string | null
          reference_number?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          full_text: string | null
          id: string
          jurisdiction: string | null
          key_definitions: Json | null
          key_obligations: Json | null
          key_penalties: Json | null
          risk_score: number | null
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          full_text?: string | null
          id?: string
          jurisdiction?: string | null
          key_definitions?: Json | null
          key_obligations?: Json | null
          key_penalties?: Json | null
          risk_score?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          full_text?: string | null
          id?: string
          jurisdiction?: string | null
          key_definitions?: Json | null
          key_obligations?: Json | null
          key_penalties?: Json | null
          risk_score?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          citations: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          citations?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          citations?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          preferred_jurisdictions: string[] | null
          preferred_sectors: string[] | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_jurisdictions?: string[] | null
          preferred_sectors?: string[] | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_jurisdictions?: string[] | null
          preferred_sectors?: string[] | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regulatory_alerts: {
        Row: {
          created_at: string
          description: string | null
          effective_date: string | null
          id: string
          jurisdiction: string
          sector: string | null
          severity: string | null
          source_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          jurisdiction: string
          sector?: string | null
          severity?: string | null
          source_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          jurisdiction?: string
          sector?: string | null
          severity?: string | null
          source_url?: string | null
          title?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
