'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';

// 카카오 로고 SVG
const KakaoLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.83 1.9 5.31 4.75 6.72l-.92 3.38c-.08.28.28.5.52.33l4.08-2.73c.52.07 1.05.1 1.57.1 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
  </svg>
);

// 구글 로고 SVG
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Provider 정보
const PROVIDER_INFO: Record<string, { name: string; logo: React.FC; bg: string; text: string; border: string }> = {
  google: { name: '구글', logo: GoogleLogo, bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-300' },
  kakao: { name: '카카오', logo: KakaoLogo, bg: 'bg-[#FEE500]', text: 'text-[#191919]', border: 'border-[#FEE500]' },
  email: { name: '이메일', logo: () => <Mail className="w-[18px] h-[18px]" />, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

export default function ProfileEditPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 계정 연결 상태
  const [identities, setIdentities] = useState<any[]>([]);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // 소셜 로그인 사용자인지 확인 (비밀번호 변경 불가)
  const isSocialUser = authUser?.app_metadata?.provider !== 'email';

  useEffect(() => {
    if (authUser) {
      const meta = authUser.user_metadata;
      setName(meta?.name || meta?.full_name || meta?.nickname || '');
      setEmail(authUser.email || '');
      setPhone(meta?.phone || '');

      // 연결된 identity 목록
      setIdentities(authUser.identities || []);
    }
  }, [authUser]);

  // Provider 연결
  const handleLinkProvider = async (provider: 'google' | 'kakao') => {
    setLinkError('');
    setLinkSuccess('');
    setLinkingProvider(provider);

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/agent/mypage/profile`,
        },
      });
      if (error) throw error;
      // OAuth 리다이렉트 되므로 여기서 끝
    } catch (err: any) {
      setLinkError(err.message || '계정 연결 중 오류가 발생했습니다.');
      setLinkingProvider(null);
    }
  };

  // Provider 연결 해제
  const handleUnlinkProvider = async (identity: any) => {
    if (identities.length <= 1) {
      setLinkError('최소 1개의 로그인 방법은 유지해야 합니다.');
      return;
    }

    const providerName = PROVIDER_INFO[identity.provider]?.name || identity.provider;
    if (!confirm(`${providerName} 계정 연결을 해제하시겠습니까?`)) return;

    setLinkError('');
    setLinkSuccess('');
    setUnlinkingProvider(identity.provider);

    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;

      setIdentities(prev => prev.filter(i => i.identity_id !== identity.identity_id));
      setLinkSuccess(`${providerName} 연결이 해제되었습니다.`);
      setTimeout(() => setLinkSuccess(''), 3000);
    } catch (err: any) {
      setLinkError(err.message || '연결 해제 중 오류가 발생했습니다.');
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setProfileError('이름을 입력해주세요.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim() },
      });

      if (error) throw error;

      // localStorage 동기화
      const savedUser = localStorage.getItem('agent_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.name = name.trim();
        localStorage.setItem('agent_user', JSON.stringify(parsed));
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!newPassword) {
      setPasswordError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
          <Link
            href="/agent/auth/login"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-gray-900">프로필 수정</h1>
            <div className="w-5" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 프로필 정보 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-500">기본 정보</h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 이름 (수정 가능) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                이름
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름을 입력하세요"
                />
              </div>
            </div>

            {/* 이메일 (고정) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                이메일 <span className="text-xs text-gray-400 font-normal">변경 불가</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 전화번호 (고정) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                전화번호 <span className="text-xs text-gray-400 font-normal">변경 불가</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone || '-'}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 프로필 저장 결과 */}
            {profileError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                저장되었습니다.
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '이름 저장'
              )}
            </button>
          </div>
        </div>

        {/* 계정 연결 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-500">계정 연결</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">여러 로그인 방법을 하나의 계정에 연결할 수 있습니다</p>
          </div>

          <div className="p-4 space-y-3">
            {/* 연결된 계정 목록 */}
            {identities.map((identity) => {
              const info = PROVIDER_INFO[identity.provider];
              if (!info) return null;
              const Logo = info.logo;
              const identityEmail = identity.identity_data?.email || '';

              return (
                <div
                  key={identity.identity_id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${info.bg} border ${info.border}`}>
                      <Logo />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{info.name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> 연결됨
                        </span>
                      </div>
                      {identityEmail && (
                        <p className="text-xs text-gray-400">{identityEmail}</p>
                      )}
                    </div>
                  </div>
                  {identities.length > 1 && (
                    <button
                      onClick={() => handleUnlinkProvider(identity)}
                      disabled={unlinkingProvider === identity.provider}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {unlinkingProvider === identity.provider ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlink className="w-3 h-3" />
                      )}
                      해제
                    </button>
                  )}
                </div>
              );
            })}

            {/* 연결 가능한 계정 */}
            {(['google', 'kakao'] as const).filter(
              (p) => !identities.some((i) => i.provider === p)
            ).map((provider) => {
              const info = PROVIDER_INFO[provider];
              const Logo = info.logo;

              return (
                <button
                  key={provider}
                  onClick={() => handleLinkProvider(provider)}
                  disabled={!!linkingProvider}
                  className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200`}>
                      <Logo />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-gray-600">{info.name}</span>
                      <p className="text-xs text-gray-400">클릭하여 연결</p>
                    </div>
                  </div>
                  {linkingProvider === provider ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">+ 연결</span>
                  )}
                </button>
              );
            })}

            {/* 에러/성공 메시지 */}
            {linkError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {linkError}
              </div>
            )}
            {linkSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {linkSuccess}
              </div>
            )}

            {/* 안내 */}
            <p className="text-xs text-gray-400 leading-relaxed pt-1">
              동일한 이메일의 계정은 자동으로 연결됩니다. 다른 이메일을 사용하는 경우 위에서 직접 연결할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 비밀번호 변경 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-500">비밀번호 변경</h2>
          </div>

          {isSocialUser ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  새 비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="새 비밀번호 (6자 이상)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPasswordConfirm ? 'text' : 'password'}
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="새 비밀번호 다시 입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 변경 결과 */}
              {passwordError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  비밀번호가 변경되었습니다.
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
