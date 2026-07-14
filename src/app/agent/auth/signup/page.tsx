'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Building2,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { signUpWithEmail, supabase, updateUserMetadata, getSession } from '@/lib/auth';
import type { BrokerOfficeInfo } from '@/app/api/broker/route';

interface SignUpFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  nickname: string;
  phone: string;
  businessNo: string;
  role: UserRole;
  // 중개사무소 정보 (구직자용)
  brokerRegNo: string;
  brokerOfficeName: string;
  brokerAddress: string;
  brokerRegDate: string;
  brokerStatus: string;
  // 약관
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const INITIAL_FORM: SignUpFormData = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  phone: '',
  businessNo: '',
  role: 'seeker',
  brokerRegNo: '',
  brokerOfficeName: '',
  brokerAddress: '',
  brokerRegDate: '',
  brokerStatus: '',
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
};

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<SignUpFormData>(INITIAL_FORM);
  const isSocialSignup = searchParams.get('social') === 'true';

  // URL ?role= 파라미터로 초기 역할 설정
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'employer' || roleParam === 'seeker') {
      setForm(prev => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  // 소셜 로그인 모드: 세션에서 이메일/이름 자동 기입
  useEffect(() => {
    if (!isSocialSignup) return;
    const initSocialForm = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setForm(prev => ({
          ...prev,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        }));
        setEmailChecked(true);
        setEmailAvailable(true);
      }
    };
    initSocialForm();
  }, [isSocialSignup]);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'agree' | 'form' | 'success'>('agree');
  const [isFetchingBroker, setIsFetchingBroker] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [phoneDuplicate, setPhoneDuplicate] = useState(false);
  // 다날 휴대폰 본인인증
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);

  // 중개사무소 정보 조회
  const fetchBrokerInfo = async () => {
    if (!form.brokerRegNo) {
      setErrors(prev => ({ ...prev, brokerRegNo: '개설등록번호를 입력해주세요' }));
      return;
    }

    setIsFetchingBroker(true);
    setErrors(prev => ({ ...prev, brokerRegNo: undefined }));
    setBrokerVerified(false);

    try {
      const response = await fetch(`/api/broker?regNo=${encodeURIComponent(form.brokerRegNo)}`);
      const result = await response.json();

      if (!response.ok) {
        setErrors(prev => ({ ...prev, brokerRegNo: result.error || '조회에 실패했습니다' }));
        return;
      }

      const data: BrokerOfficeInfo = result.data;
      setForm({
        ...form,
        brokerOfficeName: data.medOfficeNm,
        brokerAddress: data.lctnRoadNmAddr || data.lctnLotnoAddr,
        brokerRegDate: data.estblRegDe,
        brokerStatus: data.sttusSeNm || '영업중',
      });
      setBrokerVerified(true);
    } catch (error) {
      console.error('Broker fetch error:', error);
      setErrors(prev => ({ ...prev, brokerRegNo: '조회 중 오류가 발생했습니다' }));
    } finally {
      setIsFetchingBroker(false);
    }
  };

  // 이메일 중복 확인
  const checkEmailDuplicate = async () => {
    if (!form.email) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }));
      return;
    }

    setIsCheckingEmail(true);
    setErrors(prev => ({ ...prev, email: undefined }));
    setEmailChecked(false);
    setEmailAvailable(false);

    try {
      const response = await fetch(`/api/check-email?email=${encodeURIComponent(form.email)}`);
      const result = await response.json();

      if (!response.ok) {
        setErrors(prev => ({ ...prev, email: result.error || '확인에 실패했습니다' }));
        return;
      }

      setEmailChecked(true);
      if (result.exists) {
        setEmailAvailable(false);
        setErrors(prev => ({ ...prev, email: '이미 가입된 이메일입니다' }));
      } else {
        setEmailAvailable(true);
      }
    } catch (error) {
      console.error('Email check error:', error);
      setErrors(prev => ({ ...prev, email: '확인 중 오류가 발생했습니다' }));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // 연락처 중복 확인 (blur 시 자동)
  const checkPhoneDuplicate = async (phoneValue: string) => {
    const cleaned = phoneValue.replace(/-/g, '');
    if (!/^01[016789][0-9]{7,8}$/.test(cleaned)) return;

    setIsCheckingPhone(true);
    setPhoneChecked(false);
    setPhoneDuplicate(false);
    setErrors(prev => ({ ...prev, phone: undefined }));

    try {
      const response = await fetch(`/api/check-phone?phone=${encodeURIComponent(cleaned)}`);
      const result = await response.json();
      setPhoneChecked(true);
      if (result.duplicate) {
        setPhoneDuplicate(true);
        setErrors(prev => ({ ...prev, phone: '이미 등록된 연락처입니다' }));
      }
    } catch {
      // 실패 시 무시 — 가입 시 서버에서 다시 검증
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 다날 본인인증 팝업 열기
  const openDanalAuth = () => {
    setErrors(prev => ({ ...prev, phone: undefined, name: undefined }));
    window.open('/api/auth/danal/ready', 'danalAuth', 'width=430,height=640,scrollbars=yes');
  };

  // 팝업(콜백/취소 라우트)에서 오는 postMessage 수신
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // origin 검증: 현재 페이지 origin 또는 운영 도메인만 허용
      const allowed = [window.location.origin, 'https://booin.co.kr'];
      if (!allowed.includes(event.origin)) return;

      const data = event.data;
      if (!data || data.source !== 'danal-uas') return;

      if (data.ok) {
        setIsVerified(true);
        setVerificationToken(typeof data.token === 'string' ? data.token : null);
        setPhoneDuplicate(false);
        setPhoneLocked(!!data.phone);
        setForm(prev => ({
          ...prev,
          ...(data.name ? { name: String(data.name) } : {}),
          // 응답에 휴대폰번호가 오면 자동입력+잠금, 없으면 사용자 입력 유지
          ...(data.phone ? { phone: formatPhoneNumber(String(data.phone)) } : {}),
        }));
        setErrors(prev => ({ ...prev, phone: undefined, name: undefined }));
      } else if (data.cancelled) {
        // 사용자가 취소 — 조용히 무시
      } else {
        setErrors(prev => ({ ...prev, phone: data.msg || '본인인증에 실패했습니다' }));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // 사업자번호 포맷 (000-00-00000)
  const formatBusinessNo = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  // 개설등록번호 포맷 (제11710-2022-00250호 → 11710-2022-00250)
  const formatBrokerRegNo = (value: string) => {
    // "제", "호" 제거하고 숫자와 하이픈만 추출
    const cleaned = value.replace(/[제호\s]/g, '');
    const numbers = cleaned.replace(/[^\d]/g, '');

    // 14자리 숫자인 경우 자동 포맷 (XXXXX-YYYY-NNNNN)
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 9) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}-${numbers.slice(9, 14)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignUpFormData, string>> = {};

    if (!form.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    } else if (!isSocialSignup && (!emailChecked || !emailAvailable)) {
      newErrors.email = '이메일 중복확인을 해주세요';
    }

    if (!isSocialSignup) {
      if (!form.password) {
        newErrors.password = '비밀번호를 입력해주세요';
      } else if (form.password.length < 8) {
        newErrors.password = '비밀번호는 8자 이상이어야 합니다';
      } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password)) {
        newErrors.password = '영문과 숫자를 포함해야 합니다';
      }

      if (!form.passwordConfirm) {
        newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요';
      } else if (form.password !== form.passwordConfirm) {
        newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
      }
    }

    if (!form.name) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!form.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (form.nickname.length < 2 || form.nickname.length > 12) {
      newErrors.nickname = '닉네임은 2~12자로 입력해주세요';
    } else if (!/^[가-힣a-zA-Z0-9_]+$/.test(form.nickname)) {
      newErrors.nickname = '한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다';
    }

    if (!form.phone) {
      newErrors.phone = '연락처를 입력해주세요';
    } else if (!/^01[016789][0-9]{7,8}$/.test(form.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 연락처 형식이 아닙니다';
    } else if (phoneDuplicate) {
      newErrors.phone = '이미 등록된 연락처입니다';
    }

    // 휴대폰 본인인증 필수 (다날 UAS) — 미인증 시 가입 차단
    if (!isVerified || !verificationToken) {
      newErrors.phone = '휴대폰 본인인증을 완료해주세요';
    }

    if (!form.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요';
    }

    if (!form.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보 처리방침에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isSocialSignup) {
        // 소셜 로그인 유저: 서버 API로 users 테이블 + 메타데이터 업데이트
        const session = await getSession();
        if (!session) {
          throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
        }

        const profileRes = await fetch('/api/auth/complete-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name,
            nickname: form.nickname,
            phone: form.phone,
            role: form.role,
            businessNo: form.businessNo || null,
            ...(verificationToken ? { danalToken: verificationToken } : {}),
            brokerOfficeName: form.role === 'employer' && brokerVerified ? form.brokerOfficeName : null,
            ...(form.role === 'employer' && brokerVerified && {
              brokerRegNo: form.brokerRegNo,
              brokerAddress: form.brokerAddress,
              brokerRegDate: form.brokerRegDate,
            }),
          }),
        });

        if (!profileRes.ok) {
          const errorData = await profileRes.json().catch(() => ({}));
          throw new Error(errorData.error || '프로필 저장에 실패했습니다. 다시 시도해주세요.');
        }

        setNeedsEmailConfirm(false);
        setStep('success');
      } else {
        // 이메일 회원가입
        const result = await signUpWithEmail(form.email, form.password, {
          name: form.name,
          nickname: form.nickname,
          phone: form.phone,
          role: form.role,
          userType: 'agent',
          ...(verificationToken ? { danalToken: verificationToken } : {}),
          ...(form.role === 'employer' && brokerVerified && {
            brokerRegNo: form.brokerRegNo,
            brokerOfficeName: form.brokerOfficeName,
            brokerAddress: form.brokerAddress,
            brokerRegDate: form.brokerRegDate,
          }),
        });

        setNeedsEmailConfirm(!result.session);
        setStep('success');
      }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setErrors({ email: '이미 가입된 이메일입니다. 이메일 인증을 완료하지 않았다면 로그인 페이지에서 인증 메일을 재발송해주세요.' });
      } else {
        setErrors({ email: err.message || '회원가입 중 오류가 발생했습니다' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgreeAll = () => {
    const allChecked = form.agreeTerms && form.agreePrivacy && form.agreeMarketing;
    setForm({
      ...form,
      agreeTerms: !allChecked,
      agreePrivacy: !allChecked,
      agreeMarketing: !allChecked,
    });
  };

  // 1단계 — 약관 동의 화면 (필수 동의해야 가입 폼으로 진행)
  if (step === 'agree') {
    const allChecked = form.agreeTerms && form.agreePrivacy && form.agreeMarketing;
    const requiredOk = form.agreeTerms && form.agreePrivacy;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-8">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <Link href="/agent/auth/login" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-slate-900">약관 동의</h1>
              <div className="w-5" />
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">부동산인 시작하기</h2>
          <p className="text-sm text-slate-500 mb-6">서비스 이용을 위해 약관에 동의해주세요.</p>

          {/* 전체 동의 (크게 강조) */}
          <button
            type="button"
            onClick={handleAgreeAll}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all mb-3 ${
              allChecked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${allChecked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <Check className="w-4 h-4 text-white" />
            </span>
            <span className="text-left">
              <span className="block font-bold text-slate-900">전체 동의하기</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">선택 항목(마케팅 정보 수신) 동의를 포함합니다.</span>
            </span>
          </button>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreeTerms} onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700"><span className="text-red-500 font-semibold">[필수]</span> 이용약관 동의</span>
              <Link href="/terms" target="_blank" className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">보기</Link>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreePrivacy} onChange={(e) => setForm({ ...form, agreePrivacy: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700"><span className="text-red-500 font-semibold">[필수]</span> 개인정보 수집·이용 동의</span>
              <Link href="/privacy" target="_blank" className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">보기</Link>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreeMarketing} onChange={(e) => setForm({ ...form, agreeMarketing: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700"><span className="text-slate-400 font-semibold">[선택]</span> 마케팅 정보 수신 — 결제할인·프로모션 이벤트 알림</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            필수 항목에 동의하셔야 가입이 진행됩니다. 선택 항목은 동의하지 않아도 가입할 수 있어요.
          </p>

          <button
            type="button"
            disabled={!requiredOk}
            onClick={() => setStep('form')}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all mt-5 shadow-lg shadow-emerald-500/25"
          >
            다음
          </button>
          <p className="text-center text-sm text-slate-500 mt-6">
            이미 회원이신가요?{' '}
            <Link href="/agent/auth/login" className="text-emerald-600 font-semibold hover:text-emerald-700">로그인</Link>
          </p>
        </main>
      </div>
    );
  }

  // 가입 완료 화면
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-lg">
          {needsEmailConfirm ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">이메일 인증이 필요합니다</h1>
              <p className="text-slate-600 mb-2">
                <span className="font-medium text-emerald-600">{form.email}</span>
              </p>
              <p className="text-slate-500 text-sm mb-8">
                위 이메일로 인증 링크를 보내드렸습니다.<br />
                이메일을 확인하고 링크를 클릭하면 가입이 완료됩니다.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">메일이 오지 않나요?</span><br />
                  스팸 메일함을 확인해주세요. 그래도 없으면 로그인 페이지에서 재발송할 수 있습니다.
                </p>
              </div>
              <Link
                href="/agent/auth/login"
                className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
              >
                로그인 페이지로 이동
              </Link>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {isSocialSignup ? '프로필 등록 완료!' : '가입이 완료되었습니다!'}
              </h1>
              <p className="text-slate-600 mb-8">
                부동산인의 회원이 되신 것을 환영합니다.<br />
                이제 다양한 채용 공고를 확인해보세요.
              </p>
              <div className="space-y-3">
                <Link
                  href={form.role === 'employer' ? '/agent/employer' : '/agent/jobs'}
                  className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
                >
                  {form.role === 'employer' ? '구인 시작하기' : '채용공고 둘러보기'}
                </Link>
                {form.role === 'seeker' && (
                  <Link
                    href="/agent/mypage/resume"
                    className="block w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    이력서 등록하기
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-8">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/auth/login"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-slate-900">{isSocialSignup ? '추가 정보 입력' : '회원가입'}</h1>
            <div className="w-5" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 개인회원 / 기업회원 탭 */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'seeker' })}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
              form.role === 'seeker'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            개인회원
            <span className="block text-xs font-normal mt-0.5 text-slate-400">일자리를 찾고 있어요</span>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'employer' })}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
              form.role === 'employer'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            기업회원
            <span className="block text-xs font-normal mt-0.5 text-slate-400">인재를 찾고 있어요</span>
          </button>
        </div>

        {/* 소셜 로그인 안내 */}
        {isSocialSignup && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-emerald-700">
              소셜 계정으로 로그인되었습니다. 서비스 이용을 위해 아래 추가 정보를 입력해주세요.
            </p>
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              이메일 <span className="text-red-500">*</span>
              {isSocialSignup && <span className="text-slate-400 font-normal ml-2">소셜 계정 이메일</span>}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => {
                    if (!isSocialSignup) {
                      setForm({ ...form, email: e.target.value });
                      setEmailChecked(false);
                      setEmailAvailable(false);
                    }
                  }}
                  readOnly={isSocialSignup}
                  placeholder="이메일을 입력하세요"
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isSocialSignup ? 'bg-slate-50 text-slate-600 cursor-not-allowed' :
                    errors.email ? 'border-red-300' : emailChecked && emailAvailable ? 'border-green-400' : 'border-slate-200'
                  }`}
                />
              </div>
              {!isSocialSignup && (
                <button
                  type="button"
                  onClick={checkEmailDuplicate}
                  disabled={isCheckingEmail || !form.email}
                  className="px-4 py-3.5 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap flex items-center gap-1.5"
                >
                  {isCheckingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : emailChecked && emailAvailable ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : null}
                  중복확인
                </button>
              )}
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
            {!isSocialSignup && emailChecked && emailAvailable && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                사용 가능한 이메일입니다
              </p>
            )}
          </div>

          {!isSocialSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="영문, 숫자 포함 8자 이상"
                    className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.password ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={form.passwordConfirm || ''}
                    onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                    placeholder="비밀번호를 다시 입력하세요"
                    className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.passwordConfirm ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.passwordConfirm}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {form.role === 'employer' ? '이름(기업명)' : '이름'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => { if (!isVerified) setForm({ ...form, name: e.target.value }); }}
                readOnly={isVerified}
                placeholder={form.role === 'employer' ? '이름 또는 기업명을 입력하세요' : '이름을 입력하세요'}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isVerified ? 'bg-slate-50 text-slate-600 border-green-400 cursor-not-allowed' :
                  errors.name ? 'border-red-300' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              닉네임 <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-2">공인중개사 상호명</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
              <input
                type="text"
                value={form.nickname || ''}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="닉네임 (2~12자)"
                maxLength={12}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.nickname ? 'border-red-300' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.nickname && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.nickname}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              연락처 <span className="text-red-500">*</span>
              {isVerified && (
                <span className="text-green-600 font-normal ml-2 inline-flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 본인인증 완료
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => {
                    if (phoneLocked) return;
                    setForm({ ...form, phone: formatPhoneNumber(e.target.value) });
                    setPhoneChecked(false);
                    setPhoneDuplicate(false);
                  }}
                  onBlur={(e) => { if (!phoneLocked) checkPhoneDuplicate(e.target.value); }}
                  readOnly={phoneLocked}
                  placeholder="010-0000-0000"
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    phoneLocked ? 'bg-slate-50 text-slate-600 border-green-400 cursor-not-allowed' :
                    isVerified ? 'border-green-400' :
                    errors.phone ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={openDanalAuth}
                disabled={isVerified}
                className="px-4 py-3.5 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-emerald-500 disabled:cursor-default transition-colors text-sm whitespace-nowrap flex items-center gap-1.5"
              >
                {isVerified ? (
                  <><CheckCircle2 className="w-4 h-4" /> 인증완료</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> 본인인증</>
                )}
              </button>
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
            {isCheckingPhone && (
              <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                연락처 확인 중...
              </p>
            )}
            {!isVerified && (
              <p className="text-xs text-slate-400 mt-1">
                휴대폰 본인인증으로 이름·연락처가 자동 확인됩니다.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              사업자번호 <span className="text-slate-400 font-normal ml-1">선택</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={form.businessNo || ''}
                onChange={(e) => setForm({ ...form, businessNo: formatBusinessNo(e.target.value) })}
                placeholder="000-00-00000"
                maxLength={12}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">나중에 마이페이지에서도 등록할 수 있습니다</p>
          </div>

          {/* 중개사무소 정보 (기업회원만) */}
          {form.role === 'employer' && (
            <div className="pt-4">
              <div className="p-4 bg-emerald-50 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Building2 className="w-5 h-5" />
                  <span className="font-semibold">중개사무소 정보</span>
                  <span className="text-xs text-emerald-500 ml-auto">선택사항</span>
                </div>

                {/* 개설등록번호 입력 및 조회 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    개설등록번호
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={form.brokerRegNo || ''}
                        onChange={(e) => {
                          setForm({ ...form, brokerRegNo: formatBrokerRegNo(e.target.value) });
                          setBrokerVerified(false);
                        }}
                        placeholder="예: 11710-2022-00250"
                        maxLength={16}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.brokerRegNo ? 'border-red-300' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchBrokerInfo}
                      disabled={isFetchingBroker || !form.brokerRegNo}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isFetchingBroker ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      조회
                    </button>
                  </div>
                  {errors.brokerRegNo && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.brokerRegNo}
                    </p>
                  )}
                </div>

                {/* 조회된 정보 표시 */}
                {brokerVerified && (
                  <div className="p-4 bg-white rounded-xl border border-green-200 space-y-3">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">확인된 중개사무소</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">중개사무소명</p>
                          <p className="font-medium text-gray-900">{form.brokerOfficeName}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">소재지</p>
                          <p className="font-medium text-gray-900">{form.brokerAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">개설등록일</p>
                          <p className="font-medium text-gray-900">{form.brokerRegDate}</p>
                        </div>
                      </div>

                      {form.brokerStatus && (
                        <div className="pt-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            form.brokerStatus === '영업중'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {form.brokerStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  * 개설등록번호를 입력하면 공공데이터를 통해 중개사무소 정보가 자동으로 조회됩니다.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    💡 지금 등록하지 않아도 가입 가능합니다. 구인글 작성 시 중개사무소 또는 사업자등록번호 인증이 필요하며, 마이페이지에서 나중에 등록할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 약관 동의는 1단계(약관 동의 화면)에서 완료 — 폼에는 표시 안 함 */}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all mt-6 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSocialSignup ? '등록 중...' : '가입 중...'}
              </>
            ) : (
              isSocialSignup ? '프로필 등록하기' : '가입하기'
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <p className="text-center text-sm text-slate-500 mt-6">
          이미 회원이신가요?{' '}
          <Link href="/agent/auth/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
            로그인
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SignUpPageContent />
    </Suspense>
  );
}
