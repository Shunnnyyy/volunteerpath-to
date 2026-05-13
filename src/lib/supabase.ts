import { createClient } from "@supabase/supabase-js";

type VolunteerOpportunityRow = {
  id: number;
  slug: string;
  title: string;
  organization: string;
  duration: string;
  introduction: string;
  summary: string;
  best_for: string[];
  requirements: string[];
  languages: string[];
  link: string;
  source_type: string;
  source_name: string;
  is_active: boolean;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
};

type VolunteerOpportunityInsert = Omit<
  VolunteerOpportunityRow,
  "id" | "created_at"
> & {
  id?: number;
  created_at?: string;
};

type Database = {
  public: {
    Tables: {
      volunteer_opportunities: {
        Row: VolunteerOpportunityRow;
        Insert: VolunteerOpportunityInsert;
        Update: Partial<VolunteerOpportunityInsert>;
        Relationships: [];
      };
      site_stats: {
        Row: {
          key: string;
          value: number;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: number;
          updated_at?: string;
        };
        Update: {
          value?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseClient = ReturnType<typeof createClient<Database>>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let browserClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createClient<Database>(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey)
    );
  }

  return browserClient;
}

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return adminClient;
}
