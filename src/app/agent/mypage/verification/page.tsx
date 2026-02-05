'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  FileText,
  Search,
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserMetadata } from '@/lib/auth';
import type { BrokerOfficeInfo } from '@/app/api/broker/route';

type VerificationTab = 'broker' | 'business';

export default function VerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<VerificationTab>('broker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 중개사무소 상태
  const [brokerRegNo, setBrokerRegNo] = useState('');
  const [brokerOfficeName, setBrokerOfficeName] = useState('');
  const [brokerAddress, setBrokerAddress] = useState('');
  const [brokerRegDate, setBrokerRegDate] = useState('');
  const [brokerStatus, setBrokerStatus] = useState('');
  const [isFetchingBroker, setIsFetchingBroker] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);
  const [brokerError, setBrokerError] = useState('');

  // 사업자등록번호 상태
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessError, setBusinessError] = useState('');

  // 이미 인증된 상태 확인
  const meta = user?.user_metadata;
  const alreadyBrokerVerified = meta?.brokerVerified === true;
  const alreadyBusinessVerified = meta?.businessVerified === true;
  const isAlreadyVerified = alreadyBrokerVerified || alreadyBusinessVerified;

  // 개설등록번호 포맷
  const formatBrokerRegNo = (value: string) => {
    const cleaned = value.replace(/[제호\s]/g, '');
    const numbers = cleaned.replace(/[^\d]/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 9) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}-${numbers.slice(9, 14)}`;
  };

  // 사업자등록번호 포맷 (XXX-XX-XXXXX)
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  // 사업자등록번호 검증 (10자리)
  const validateBusinessNumber = (num: string): boolean => {
    const digits = num.replace(/[^\d]/g, '');
    return digits.length === 10;
  };

  // 중개사무소 조회
  const fetchBrokerInfo = async () => {
    if (!brokerRegNo) {
      setBrokerError('개설등록번호를 입력해주세요');
      return;
    }

    setIsFetchingBroker(true);
    setBrokerError('');
    setBrokerVerified(false);

    try {
      const response = await fetch(`/api/broker?regNo=${encodeURIComponent(brokerRegNo)}`);
      const result = await response.json();

      if (!response.ok) {
        setBrokerError(result.error || '조회에 실패했습니다');
        return;
      }

      const data: BrokerOfficeInfo = result.data;
      setBrokerOfficeName(data.medOfficeNm);
      setBrokerAddress(data.lctnRoadNmAddr || data.lctnLotnoAddr);
      setBrokerRegDate(data.estblRegDe);
      setBrokerStatus(data.sttusSeNm || '영업중');
      setBrokerVerified(true);
    } catch (error) {
      console.error('Broker fetch error:', error);
      setBrokerError('조회 중 오류가 발생했습니다');
    } finally {
      setIsFetchingBroker(false);
    }
  };

  // 중개사무소 인증 저장
  const handleBrokerSubmit = async () => {
    if (!brokerVerified) {
      setBrokerError('먼저 개설등록번호를 조회해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserMetadata({
        brokerRegNo,
        brokerOfficeName,
        brokerAddress,
        brokerRegDate,
        brokerVerified: true,
      });
      setSuccessMessage('중개사무소 인증이 완료되었습니다!');
    } catch (error) {
      console.error('Save error:', error);
      setBrokerError('저장 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 사업자등록번호 인증 저장
  const handleBusinessSubmit = async () => {
    if (!validateBusinessNumber(businessNumber)) {
      setBusinessError('사업자등록번호는 10자리 숫자입니다');
      return;
    }

    setIsSubmitting(true);
    setBusinessError('');
    try {
      await updateUserMetadata({
        businessNumber: businessNumber.replace(/[^\d]/g, ''),
        businessVerified: true,
      });
      setSuccessMessage('사업자등록번호 인증이 완료되었습니다!');
    } catch (error) {
      console.error('Save error:', error);
      setBusinessError('저장 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인증 완료 화면
  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{successMessage}</h1>
          <p className="text-gray-600 mb-8">
            이제 구인글을 작성하실 수 있습니다.
          </p>
          <div className="space-y-3">
            <Link
              href="/sales/jobs/new"
              className="block w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              구인글 작성하기
            </Link>
            <Link
              href="/agent/mypage"
              className="block w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              마이페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 이미 인증된 경우
  if (isAlreadyVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">이미 인증이 완료되었습니다</h1>
          <p className="text-gray-600 mb-2">
            {alreadyBrokerVerified && `중개사무소: ${meta?.brokerOfficeName || ''}`}
            {alreadyBusinessVerified && `사업자등록번호: ${meta?.businessNumber || ''}`}
          </p>
          <p className="text-sm text-gray-500 mb-8">구인글 작성이 가능합니다.</p>
          <div className="space-y-3">
            <Link
              href="/sales/jobs/new"
              className="block w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              구인글 작성하기
            </Link>
            <Link
              href="/agent/mypage"
              className="block w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              마이페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900">기업 인증</h1>
            <div className="w-5" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 안내 문구 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <p className="text-sm text-blue-700">
            구인글을 작성하려면 아래 중 하나의 인증이 필요합니다. 중개사무소 등록번호 또는 사업자등록번호를 등록해주세요.
          </p>
        </div>

        {/* 탭 선택 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('broker')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'broker'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            중개사무소
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'business'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            사업자등록번호
          </button>
        </div>

        {/* 중개사무소 탭 */}
        {activeTab === 'broker' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                중개사무소 등록번호 인증
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  개설등록번호
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brokerRegNo}
                    onChange={(e) => {
                      setBrokerRegNo(formatBrokerRegNo(e.target.value));
                      setBrokerVerified(false);
                    }}
                    placeholder="예: 11710-2022-00250"
                    maxLength={16}
                    className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      brokerError ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={fetchBrokerInfo}
                    disabled={isFetchingBroker || !brokerRegNo}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isFetchingBroker ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    조회
                  </button>
                </div>
                {brokerError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {brokerError}
                  </p>
                )}
              </div>

              {/* 조회된 정보 */}
              {brokerVerified && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">확인된 중개사무소</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">중개사무소명</p>
                        <p className="font-medium text-gray-900">{brokerOfficeName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">소재지</p>
                        <p className="font-medium text-gray-900">{brokerAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-500">개설등록일</p>
                        <p className="font-medium text-gray-900">{brokerRegDate}</p>
                      </div>
                    </div>
                    {brokerStatus && (
                      <div className="pt-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          brokerStatus === '영업중'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {brokerStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleBrokerSubmit}
                disabled={!brokerVerified || isSubmitting}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '중개사무소 인증 완료'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 사업자등록번호 탭 */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                사업자등록번호 인증
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  value={businessNumber}
                  onChange={(e) => {
                    setBusinessNumber(formatBusinessNumber(e.target.value));
                    setBusinessError('');
                  }}
                  placeholder="예: 123-45-67890"
                  maxLength={12}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    businessError ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {businessError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {businessError}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  * 사업자등록번호 10자리를 입력해주세요.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBusinessSubmit}
                disabled={!businessNumber || isSubmitting}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '사업자등록번호 인증 완료'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
