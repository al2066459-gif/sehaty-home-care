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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ambulance_companies: {
        Row: {
          address: string | null
          availability_confirmed: boolean
          city_id: string
          coordinate_source_url: string | null
          coverage: string[]
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phones: string[]
          published: boolean
          region_id: string | null
          services: string[]
          source_urls: string[]
          updated_at: string
          vehicle_types: string[]
          verification: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          availability_confirmed?: boolean
          city_id: string
          coordinate_source_url?: string | null
          coverage?: string[]
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phones?: string[]
          published?: boolean
          region_id?: string | null
          services?: string[]
          source_urls?: string[]
          updated_at?: string
          vehicle_types?: string[]
          verification?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          availability_confirmed?: boolean
          city_id?: string
          coordinate_source_url?: string | null
          coverage?: string[]
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phones?: string[]
          published?: boolean
          region_id?: string | null
          services?: string[]
          source_urls?: string[]
          updated_at?: string
          vehicle_types?: string[]
          verification?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_companies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "directory_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_companies_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "directory_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_requests: {
        Row: {
          city: string
          company_id: string | null
          created_at: string
          destination: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          phone: string
          pickup: string
          region: string | null
          requester_name: string
          status: string
          transport_type: string
        }
        Insert: {
          city: string
          company_id?: string | null
          created_at?: string
          destination: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone: string
          pickup: string
          region?: string | null
          requester_name: string
          status?: string
          transport_type: string
        }
        Update: {
          city?: string
          company_id?: string | null
          created_at?: string
          destination?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string
          pickup?: string
          region?: string | null
          requester_name?: string
          status?: string
          transport_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ambulance_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_cities: {
        Row: {
          country: string
          id: string
          name: string
        }
        Insert: {
          country?: string
          id?: string
          name: string
        }
        Update: {
          country?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      directory_clinics: {
        Row: {
          address: string | null
          city_id: string
          coordinate_source_url: string | null
          id: string
          kind: string
          latitude: number | null
          longitude: number | null
          name: string
          phones: string[]
          photo_attribution: string | null
          photo_url: string | null
          published: boolean
          region_id: string | null
          services: string[]
          source_urls: string[]
          specialties: string[]
          updated_at: string
          verified_at: string | null
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          city_id: string
          coordinate_source_url?: string | null
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phones?: string[]
          photo_attribution?: string | null
          photo_url?: string | null
          published?: boolean
          region_id?: string | null
          services?: string[]
          source_urls?: string[]
          specialties?: string[]
          updated_at?: string
          verified_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string
          coordinate_source_url?: string | null
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phones?: string[]
          photo_attribution?: string | null
          photo_url?: string | null
          published?: boolean
          region_id?: string | null
          services?: string[]
          source_urls?: string[]
          specialties?: string[]
          updated_at?: string
          verified_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_clinics_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "directory_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_clinics_region_id_city_id_fkey"
            columns: ["region_id", "city_id"]
            isOneToOne: false
            referencedRelation: "directory_regions"
            referencedColumns: ["id", "city_id"]
          },
        ]
      }
      directory_regions: {
        Row: {
          city_id: string
          id: string
          name: string
        }
        Insert: {
          city_id: string
          id?: string
          name: string
        }
        Update: {
          city_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_regions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "directory_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
