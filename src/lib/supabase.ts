import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 타입 정의 (추후 Supabase 스키마와 연동)
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'apartment' | 'officetel' | 'store' | 'industrial';
          tier: 'unique' | 'superior' | 'premium' | 'normal';
          badges: string[];
          position: 'headTeam' | 'teamLead' | 'member';
          salary_type: 'commission' | 'base_incentive' | 'daily';
          salary_amount: string | null;
          benefits: string[];
          experience: 'none' | '1month' | '3month' | '6month' | '12month';
          company: string;
          company_type: 'developer' | 'builder' | 'agency' | 'trust' | null;
          region: string;
          thumbnail: string | null;
          html_content: string | null;
          views: number;
          user_id: string;
          created_at: string;
          updated_at: string;
          deadline: string | null;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at' | 'views'>;
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          company_name: string | null;
          user_type: 'employer' | 'seeker' | 'admin';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
    };
  };
};
