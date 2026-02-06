import { createClient } from '@supabase/supabase-js';
import type { SalesJobListing, AgentResume, AgentCareer } from '@/types';

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

// ========== 이력서 관련 함수 ==========

// DB 데이터를 AgentResume 타입으로 변환
export function mapDbResumeToResume(data: any): AgentResume {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    birthYear: data.birth_year,
    gender: data.gender,
    photo: data.photo,
    licenseNumber: data.license_number,
    licenseDate: data.license_date,
    totalExperience: data.total_experience || 'none',
    careers: data.careers || [],
    preferredRegions: data.preferred_regions || [],
    preferredTypes: data.preferred_types || [],
    preferredSalary: data.preferred_salary || { type: 'mixed' },
    availableDate: data.available_date,
    introduction: data.introduction,
    strengths: data.strengths || [],
    dnaType: data.dna_type,
    dnaScores: data.dna_scores,
    dnaAnswerDetails: data.dna_answer_details,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isPublic: data.is_public ?? true,
  };
}

// AgentResume을 DB 형식으로 변환
export function mapResumeToDb(resume: Partial<AgentResume>, userId: string) {
  return {
    user_id: userId,
    name: resume.name,
    phone: resume.phone,
    email: resume.email,
    birth_year: resume.birthYear,
    gender: resume.gender,
    photo: resume.photo,
    license_number: resume.licenseNumber,
    license_date: resume.licenseDate,
    total_experience: resume.totalExperience,
    careers: resume.careers,
    preferred_regions: resume.preferredRegions,
    preferred_types: resume.preferredTypes,
    preferred_salary: resume.preferredSalary,
    available_date: resume.availableDate,
    introduction: resume.introduction,
    strengths: resume.strengths,
    dna_type: resume.dnaType,
    dna_scores: resume.dnaScores,
    dna_answer_details: resume.dnaAnswerDetails,
    is_public: resume.isPublic,
  };
}

// 내 이력서 가져오기
export async function fetchMyResume(userId: string): Promise<AgentResume | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 이력서 없음 (정상)
      return null;
    }
    console.error('Error fetching resume:', error);
    return null;
  }

  return mapDbResumeToResume(data);
}

// 이력서 저장 (upsert)
export async function saveResume(resume: Partial<AgentResume>, userId: string): Promise<AgentResume | null> {
  const dbData = mapResumeToDb(resume, userId);

  const { data, error } = await supabase
    .from('resumes')
    .upsert(dbData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving resume:', error);
    return null;
  }

  return mapDbResumeToResume(data);
}

// 이력서 삭제
export async function deleteResume(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting resume:', error);
    return false;
  }

  return true;
}

// 공개 이력서 목록 가져오기 (구인자용)
export async function fetchPublicResumes(filters?: {
  regions?: string[];
  types?: string[];
  experience?: string;
}): Promise<AgentResume[]> {
  let query = supabase
    .from('resumes')
    .select('*')
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  if (filters?.experience && filters.experience !== 'none') {
    query = query.eq('total_experience', filters.experience);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching public resumes:', error);
    return [];
  }

  let resumes = (data || []).map(mapDbResumeToResume);

  // 클라이언트 사이드 필터링 (배열 필드)
  if (filters?.regions && filters.regions.length > 0) {
    resumes = resumes.filter(r =>
      r.preferredRegions.some(region => filters.regions!.includes(region))
    );
  }

  if (filters?.types && filters.types.length > 0) {
    resumes = resumes.filter(r =>
      r.preferredTypes.some(type => filters.types!.includes(type))
    );
  }

  return resumes;
}

// 이력서 ID로 가져오기 (지원서 열람용)
export async function fetchResumeById(resumeId: string): Promise<AgentResume | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (error) {
    console.error('Error fetching resume by id:', error);
    return null;
  }

  return mapDbResumeToResume(data);
}

// ========== 지원 관련 함수 ==========

// 이력서로 지원하기
export async function applyWithResume(
  jobId: string,
  userId: string,
  resumeId: string,
  message?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      user_id: userId,
      resume_id: resumeId,
      message: message,
      status: 'pending',
    });

  if (error) {
    if (error.code === '23505') {
      // 이미 지원한 공고
      console.error('Already applied to this job');
    } else {
      console.error('Error applying:', error);
    }
    return false;
  }

  return true;
}

// 내 지원 내역 가져오기
export async function fetchMyApplications(userId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs:job_id (
        id, title, company, region, tier, type, deadline
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return data || [];
}

// 공고에 대한 지원자 목록 가져오기 (구인자용)
export async function fetchApplicationsForJob(jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      resumes:resume_id (
        id, name, phone, email, photo, total_experience,
        preferred_regions, preferred_types, license_number
      )
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications for job:', error);
    return [];
  }

  return data || [];
}

// 지원 상태 업데이트 (구인자용)
export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'viewed' | 'contacted' | 'rejected' | 'hired'
): Promise<boolean> {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating application status:', error);
    return false;
  }

  return true;
}

// 내 공고 목록 가져오기 (구인자용)
export async function fetchMyJobs(userId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my jobs:', error);
    return [];
  }

  return data || [];
}

// 공고별 지원자 수 가져오기
export async function fetchApplicationCounts(jobIds: string[]): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('applications')
    .select('job_id')
    .in('job_id', jobIds);

  if (error) {
    console.error('Error fetching application counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  (data || []).forEach(app => {
    counts[app.job_id] = (counts[app.job_id] || 0) + 1;
  });

  return counts;
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
