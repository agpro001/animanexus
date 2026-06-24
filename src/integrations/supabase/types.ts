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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          animal_id: string | null
          confidence: number | null
          created_at: string
          id: string
          input_meta: Json | null
          kind: string
          owner_id: string
          result: Json
          risk_label: string | null
        }
        Insert: {
          animal_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          input_meta?: Json | null
          kind: string
          owner_id: string
          result: Json
          risk_label?: string | null
        }
        Update: {
          animal_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          input_meta?: Json | null
          kind?: string
          owner_id?: string
          result?: Json
          risk_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_events: {
        Row: {
          animal_id: string
          created_at: string
          detail: string | null
          id: string
          kind: string
          meta: Json | null
          owner_id: string
          title: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          meta?: Json | null
          owner_id: string
          title: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          activity_score: number | null
          age_years: number | null
          ai_summary: string | null
          breed: string | null
          color: string | null
          created_at: string
          gender: string | null
          health_status: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          notes: string | null
          owner_id: string
          risk_level: string | null
          species: string
          stress_score: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_score?: number | null
          age_years?: number | null
          ai_summary?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          gender?: string | null
          health_status?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          notes?: string | null
          owner_id: string
          risk_level?: string | null
          species: string
          stress_score?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_score?: number | null
          age_years?: number | null
          ai_summary?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          gender?: string | null
          health_status?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          risk_level?: string | null
          species?: string
          stress_score?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      emergency_reports: {
        Row: {
          action_plan: Json | null
          animal_id: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          owner_id: string
          scenario: string
          severity: string | null
          status: string | null
        }
        Insert: {
          action_plan?: Json | null
          animal_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          owner_id: string
          scenario: string
          severity?: string | null
          status?: string | null
        }
        Update: {
          action_plan?: Json | null
          animal_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          owner_id?: string
          scenario?: string
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reports: {
        Row: {
          ai_tags: Json | null
          breed: string | null
          collar: string | null
          color: string | null
          contact: string | null
          created_at: string
          id: string
          last_seen_address: string | null
          last_seen_at: string | null
          last_seen_lat: number | null
          last_seen_lng: number | null
          name: string
          owner_id: string
          photo_url: string | null
          size: string | null
          species: string
          status: string | null
          temperament: string | null
          updated_at: string
        }
        Insert: {
          ai_tags?: Json | null
          breed?: string | null
          collar?: string | null
          color?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          last_seen_address?: string | null
          last_seen_at?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          name: string
          owner_id: string
          photo_url?: string | null
          size?: string | null
          species: string
          status?: string | null
          temperament?: string | null
          updated_at?: string
        }
        Update: {
          ai_tags?: Json | null
          breed?: string | null
          collar?: string | null
          color?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          last_seen_address?: string | null
          last_seen_at?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          name?: string
          owner_id?: string
          photo_url?: string | null
          size?: string | null
          species?: string
          status?: string | null
          temperament?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shelter_animals: {
        Row: {
          age_years: number | null
          created_at: string
          description: string | null
          energy: number | null
          friendliness: number | null
          good_with_kids: boolean | null
          good_with_pets: boolean | null
          id: string
          name: string
          needs_yard: boolean | null
          owner_id: string
          photo_url: string | null
          shelter_name: string | null
          special_needs: string | null
          species: string
          status: string | null
        }
        Insert: {
          age_years?: number | null
          created_at?: string
          description?: string | null
          energy?: number | null
          friendliness?: number | null
          good_with_kids?: boolean | null
          good_with_pets?: boolean | null
          id?: string
          name: string
          needs_yard?: boolean | null
          owner_id: string
          photo_url?: string | null
          shelter_name?: string | null
          special_needs?: string | null
          species: string
          status?: string | null
        }
        Update: {
          age_years?: number | null
          created_at?: string
          description?: string | null
          energy?: number | null
          friendliness?: number | null
          good_with_kids?: boolean | null
          good_with_pets?: boolean | null
          id?: string
          name?: string
          needs_yard?: boolean | null
          owner_id?: string
          photo_url?: string | null
          shelter_name?: string | null
          special_needs?: string | null
          species?: string
          status?: string | null
        }
        Relationships: []
      }
      sightings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          lost_report_id: string | null
          match_confidence: number | null
          photo_url: string | null
          reporter_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          lost_report_id?: string | null
          match_confidence?: number | null
          photo_url?: string | null
          reporter_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          lost_report_id?: string | null
          match_confidence?: number | null
          photo_url?: string | null
          reporter_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sightings_lost_report_id_fkey"
            columns: ["lost_report_id"]
            isOneToOne: false
            referencedRelation: "lost_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      wildlife_alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          reporter_id: string | null
          severity: number | null
          status: string | null
          threat: string
          zone_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          reporter_id?: string | null
          severity?: number | null
          status?: string | null
          threat: string
          zone_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          reporter_id?: string | null
          severity?: number | null
          status?: string | null
          threat?: string
          zone_name?: string
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
