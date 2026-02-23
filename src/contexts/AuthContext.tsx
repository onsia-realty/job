'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser, getSession, signOut as authSignOut, onAuthStateChange } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    const initAuth = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);

        if (currentSession) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
      } catch (error: unknown) {
        // 리프레시 토큰 만료 → 세션 정리
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('Refresh Token') || msg.includes('refresh_token')) {
          await authSignOut().catch(() => {});
          setUser(null);
          setSession(null);
        }
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Auth 상태 변경 구독
    const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.access_token) {
        // users 테이블에 레코드 자동 생성 (소셜 로그인 등 콜백 외 경로 보완)
        fetch('/api/auth/ensure-user', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${newSession.access_token}` },
        }).catch(() => {});
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }

      // 리프레시 토큰 만료 시 자동 로그아웃
      if (event === 'TOKEN_REFRESHED' && !newSession) {
        await authSignOut().catch(() => {});
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      setSession(null);
      // localStorage 정리
      localStorage.removeItem('agent_user');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
