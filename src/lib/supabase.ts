import { createClient } from '@supabase/supabase-js';
import type { SalesJobListing } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DB 데이터를 SalesJobListing 타입으로 변환
export function mapDbJobToListing(job: any): SalesJobListing {
  return {
    id: job.id,
    title: job.title,
    description: job.description || '',
    type: job.type,
    tier: job.tier,
    badges: job.badges || [],
    position: job.position,
    salary: {
      type: job.salary_type,
      amount: job.salary_amount || undefined,
    },
    benefits: job.benefits || [],
    experience: job.experience || 'none',
    company: job.company,
    companyType: job.company_type,
    region: job.region,
    views: job.views || 0,
    createdAt: new Date(job.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, ''),
    thumbnail: job.thumbnail || undefined,
  };
}

// 공고 목록 가져오기
export async function fetchJobs(category: 'sales' | 'agent' = 'sales') {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  return (data || []).map(mapDbJobToListing);
}

// 단일 공고 가져오기
export async function fetchJobById(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  return mapDbJobToListing(data);
}

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
