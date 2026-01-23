'use client';

interface SocialLoginButtonsProps {
  userType: 'jobseeker' | 'employer';
}

export default function SocialLoginButtons({ userType }: SocialLoginButtonsProps) {
  const handleSocialLogin = (provider: 'kakao' | 'google' | 'naver') => {
    // 추후 실제 소셜 로그인 API 연동
    console.log(`${provider} login for ${userType}`);
  };

  return (
    <div className="space-y-3">
      {/* 카카오 */}
      <button
        type="button"
        onClick={() => handleSocialLogin('kakao')}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: '#FEE500', color: '#000000' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 3C5.58 3 2 5.84 2 9.35C2 11.51 3.4 13.41 5.55 14.54L4.77 17.46C4.72 17.64 4.93 17.79 5.09 17.68L8.56 15.44C9.03 15.5 9.51 15.54 10 15.54C14.42 15.54 18 12.7 18 9.19C18 5.84 14.42 3 10 3Z"
            fill="#000000"
          />
        </svg>
        카카오로 시작하기
      </button>

      {/* Google */}
      <button
        type="button"
        onClick={() => handleSocialLogin('google')}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-sm transition-all hover:bg-gray-50 active:scale-[0.98] border"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#DADCE0', color: '#3C4043' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M19.6 10.23c0-.68-.06-1.34-.17-1.97H10v3.73h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.29z" fill="#4285F4"/>
          <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.89.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.08v2.6A9.99 9.99 0 0010 20z" fill="#34A853"/>
          <path d="M4.42 11.9a5.99 5.99 0 010-3.8V5.5H1.08a9.99 9.99 0 000 9l3.34-2.6z" fill="#FBBC05"/>
          <path d="M10 3.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87C14.96 .99 12.7 0 10 0A9.99 9.99 0 001.08 5.5l3.34 2.6C5.2 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
        </svg>
        Google로 시작하기
      </button>

      {/* 네이버 */}
      <button
        type="button"
        onClick={() => handleSocialLogin('naver')}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: '#03C75A', color: '#FFFFFF' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M13.56 10.7L6.17 3H3V17H6.44V9.3L13.83 17H17V3H13.56V10.7Z"
            fill="#FFFFFF"
          />
        </svg>
        네이버로 시작하기
      </button>
    </div>
  );
}
