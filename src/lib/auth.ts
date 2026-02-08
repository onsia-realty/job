import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string];
  },
});

// 소셜 로그인
export async function signInWithProvider(provider: Provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/agent/auth/callback`,
    },
  });

  if (error) {
    console.error('Social login error:', error);
    throw error;
  }

  return data;
}

// 이메일 로그인
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Email login error:', error);
    throw error;
  }

  return data;
}

// 이메일 회원가입
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: {
    name?: string;
    nickname?: string;
    phone?: string;
    userType?: string;
    role?: string;
    // 중개사무소 정보 (기업회원용)
    brokerRegNo?: string;
    brokerOfficeName?: string;
    brokerAddress?: string;
    brokerRegDate?: string;
  }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/agent/auth/callback`,
    },
  });

  if (error) {
    console.error('Sign up error:', error);
    throw error;
  }

  return data;
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// 현재 사용자 가져오기
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error);
    return null;
  }

  return user;
}

// 세션 가져오기
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Get session error:', error);
    return null;
  }

  return session;
}

// 사용자 메타데이터 업데이트 (인증 정보 저장용)
export async function updateUserMetadata(metadata: Record<string, any>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    console.error('Update metadata error:', error);
    throw error;
  }

  return data;
}

// 이메일 인증 재발송
export async function resendConfirmationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    console.error('Resend confirmation error:', error);
    throw error;
  }

  return data;
}

// Auth 상태 변경 리스너
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
