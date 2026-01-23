'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, ShieldCheck, RotateCw } from 'lucide-react';

const signupSchema = z.object({
  phone: z
    .string()
    .min(1, '휴대폰 번호를 입력해주세요')
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
  verificationCode: z
    .string()
    .min(1, '인증번호를 입력해주세요')
    .length(6, '인증번호 6자리를 입력해주세요'),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  userType: 'jobseeker' | 'employer';
}

type VerificationStatus = 'idle' | 'sending' | 'sent' | 'verified' | 'error';

export default function SignupForm({ userType }: SignupFormProps) {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [timer, setTimer] = useState(0);
  const [agreedTerms, setAgreedTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
    notification: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const phone = watch('phone');

  // 타이머
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = useCallback((seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  }, []);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSendCode = () => {
    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) return;
    setVerificationStatus('sending');
    // 실제 API 연동 시 대체
    setTimeout(() => {
      setVerificationStatus('sent');
      setTimer(180); // 3분
    }, 1000);
  };

  const handleResend = () => {
    setVerificationStatus('sending');
    setTimeout(() => {
      setVerificationStatus('sent');
      setTimer(180);
    }, 1000);
  };

  const requiredTermsAgreed = agreedTerms.service && agreedTerms.privacy;

  const toggleAllTerms = () => {
    const allChecked = agreedTerms.service && agreedTerms.privacy && agreedTerms.marketing && agreedTerms.notification;
    setAgreedTerms({
      service: !allChecked,
      privacy: !allChecked,
      marketing: !allChecked,
      notification: !allChecked,
    });
  };

  const onSubmit = (data: SignupFormData) => {
    if (!requiredTermsAgreed) return;
    // 실제로는 인증 확인 API 호출
    console.log('Signup:', { ...data, userType });
    if (userType === 'jobseeker') {
      router.push('/auth/signup/step2');
    } else {
      router.push('/auth/signup/step2-employer');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 휴대폰 번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          휴대폰 번호
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            {...register('phone')}
            type="tel"
            placeholder="010-0000-0000"
            maxLength={13}
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value);
            }}
            className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        {errors.phone && (
          <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* 인증번호 받기 버튼 */}
      {verificationStatus === 'idle' && (
        <button
          type="button"
          onClick={handleSendCode}
          disabled={!phone || phone.replace(/[^0-9]/g, '').length < 10}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
        >
          인증번호 받기
        </button>
      )}

      {verificationStatus === 'sending' && (
        <button
          type="button"
          disabled
          className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        >
          <RotateCw className="w-4 h-4 animate-spin" />
          전송 중...
        </button>
      )}

      {/* 인증번호 입력 */}
      {(verificationStatus === 'sent' || verificationStatus === 'verified') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            인증번호
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              {...register('verificationCode')}
              type="text"
              inputMode="numeric"
              placeholder="6자리 입력"
              maxLength={6}
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          {errors.verificationCode && (
            <p className="mt-1.5 text-xs text-red-500">{errors.verificationCode.message}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-orange-500 font-medium">
              {timer > 0 ? `${formatTime(timer)} 남음` : '시간 초과'}
            </span>
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              재전송
            </button>
          </div>
        </div>
      )}

      {/* 약관 동의 */}
      {(verificationStatus === 'sent' || verificationStatus === 'verified') && (
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms.service && agreedTerms.privacy && agreedTerms.marketing && agreedTerms.notification}
              onChange={toggleAllTerms}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-gray-800">전체 동의</span>
          </label>

          <div className="border-t border-gray-100 pt-3 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreedTerms.service}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, service: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-blue-600 font-medium">[필수]</span> 서비스 이용약관 동의
                </span>
              </div>
              <button type="button" className="text-xs text-gray-400 hover:text-gray-600 underline">보기</button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreedTerms.privacy}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, privacy: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-blue-600 font-medium">[필수]</span> 개인정보 처리방침 동의
                </span>
              </div>
              <button type="button" className="text-xs text-gray-400 hover:text-gray-600 underline">보기</button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreedTerms.marketing}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, marketing: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-gray-400">[선택]</span> 마케팅 정보 수신 동의
                </span>
              </div>
              <button type="button" className="text-xs text-gray-400 hover:text-gray-600 underline">보기</button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreedTerms.notification}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, notification: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-gray-400">[선택]</span> 채용/구직 알림 수신 동의
                  <span className="ml-1 text-xs text-green-600">(추천)</span>
                </span>
              </div>
              <button type="button" className="text-xs text-gray-400 hover:text-gray-600 underline">보기</button>
            </label>
          </div>
        </div>
      )}

      {/* 다음 단계 버튼 */}
      {(verificationStatus === 'sent' || verificationStatus === 'verified') && (
        <button
          type="submit"
          disabled={!requiredTermsAgreed}
          className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
        >
          다음 단계
        </button>
      )}
    </form>
  );
}
