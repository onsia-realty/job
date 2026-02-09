'use client';

import { useState, useEffect } from 'react';
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
  Camera,
  CreditCard,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserMetadata } from '@/lib/auth';
import { uploadImage } from '@/lib/upload';
import type { BrokerOfficeInfo } from '@/app/api/broker/route';

type VerificationTab = 'broker' | 'business' | 'card';

export default function VerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<VerificationTab>('broker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false); // 이미 인증된 상태에서 추가 인증 폼 표시

  // URL 해시로 탭 자동 선택 (#broker, #business, #card)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'business') setActiveTab('business');
    if (hash === 'broker') setActiveTab('broker');
    if (hash === 'card') setActiveTab('card');
    if (hash === 'add' || hash === 'broker' || hash === 'business' || hash === 'card') setShowForm(true);
  }, []);

  // 중개사무소 상태
  const [brokerRegNo, setBrokerRegNo] = useState('');
  const [brokerOfficeName, setBrokerOfficeName] = useState('');
  const [brokerAddress, setBrokerAddress] = useState('');
  const [brokerRegDate, setBrokerRegDate] = useState('');
  const [brokerStatus, setBrokerStatus] = useState('');
  const [isFetchingBroker, setIsFetchingBroker] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);
  const [brokerError, setBrokerError] = useState('');
  const [brokerTaxEmail, setBrokerTaxEmail] = useState('');  // 세금계산서 이메일

  // 사업자등록번호 상태
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessError, setBusinessError] = useState('');
  const [isFetchingBusiness, setIsFetchingBusiness] = useState(false);
  const [businessVerified, setBusinessVerified] = useState(false);
  const [businessStatus, setBusinessStatus] = useState('');
  const [businessStatusCode, setBusinessStatusCode] = useState('');
  const [businessTaxType, setBusinessTaxType] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'nts_api' | 'checksum_only' | ''>('');

  // 사업자등록증 추가 정보
  const [bizName, setBizName] = useState('');           // 상호(사업자 이름)
  const [bizSector, setBizSector] = useState('');       // 업태
  const [bizItem, setBizItem] = useState('');           // 종목
  const [bizEmail, setBizEmail] = useState('');         // 세금계산서 이메일
  const [bizType, setBizType] = useState('');           // individual/corporate
  const [bizTypeLabel, setBizTypeLabel] = useState(''); // 개인사업자/법인사업자

  // 명함 인증 상태
  const [cardName, setCardName] = useState('');           // 이름
  const [cardCompany, setCardCompany] = useState('');     // 소속회사
  const [cardProject, setCardProject] = useState('');     // 분양현장명
  const [cardPhone, setCardPhone] = useState('');         // 연락처
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [cardError, setCardError] = useState('');
  const [isUploadingCard, setIsUploadingCard] = useState(false);

  // 이미 인증된 상태 확인
  const meta = user?.user_metadata;
  const alreadyBrokerVerified = meta?.brokerVerified === true;
  const alreadyBusinessVerified = meta?.businessVerified === true;
  const alreadyCardVerified = meta?.cardVerified === true;
  const isAlreadyVerified = alreadyBrokerVerified || alreadyBusinessVerified || alreadyCardVerified;

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
        brokerTaxEmail: brokerTaxEmail.trim(),
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

  // 사업자등록번호 국세청 조회
  const fetchBusinessStatus = async () => {
    if (!validateBusinessNumber(businessNumber)) {
      setBusinessError('사업자등록번호는 10자리 숫자입니다');
      return;
    }

    setIsFetchingBusiness(true);
    setBusinessError('');
    setBusinessVerified(false);
    setBusinessStatus('');
    setBusinessStatusCode('');
    setBusinessTaxType('');
    setVerificationMethod('');

    try {
      const response = await fetch('/api/business-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessNumber: businessNumber.replace(/[^\d]/g, ''),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setBusinessError(result.error || '조회에 실패했습니다');
        return;
      }

      const data = result.data;
      setBusinessStatusCode(data.b_stt_cd);
      setBusinessStatus(data.b_stt);
      setBusinessTaxType(data.tax_type);
      setVerificationMethod(data.verification_method || 'nts_api');
      setBizType(data.biz_type || '');
      setBizTypeLabel(data.biz_type_label || '');

      if (data.b_stt_cd === '01') {
        setBusinessVerified(true);
      } else if (data.b_stt_cd === '02') {
        setBusinessError('휴업 상태의 사업자입니다. 영업 중인 사업자만 인증 가능합니다.');
      } else if (data.b_stt_cd === '03') {
        setBusinessError('폐업된 사업자입니다. 영업 중인 사업자만 인증 가능합니다.');
      } else {
        setBusinessError('국세청에 등록되지 않은 사업자등록번호입니다.');
      }
    } catch (error) {
      console.error('Business verify error:', error);
      setBusinessError('조회 중 오류가 발생했습니다');
    } finally {
      setIsFetchingBusiness(false);
    }
  };

  // 사업자등록번호 인증 저장
  const handleBusinessSubmit = async () => {
    if (!businessVerified) {
      setBusinessError('먼저 사업자등록번호를 조회해주세요');
      return;
    }
    if (!bizName.trim()) {
      setBusinessError('상호(사업자명)를 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    setBusinessError('');
    try {
      await updateUserMetadata({
        businessNumber: businessNumber.replace(/[^\d]/g, ''),
        businessStatus,
        businessTaxType,
        bizName: bizName.trim(),
        bizSector: bizSector.trim(),
        bizItem: bizItem.trim(),
        bizEmail: bizEmail.trim(),
        bizType,
        bizTypeLabel,
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

  // 명함 이미지 선택
  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setCardError('이미지 크기는 최대 2MB입니다.');
        return;
      }
      setCardImageFile(file);
      setCardError('');
      const reader = new FileReader();
      reader.onloadend = () => setCardImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 명함 인증 저장
  const handleCardSubmit = async () => {
    if (!cardName.trim()) {
      setCardError('이름을 입력해주세요');
      return;
    }
    if (!cardCompany.trim()) {
      setCardError('소속회사를 입력해주세요');
      return;
    }
    if (!cardProject.trim()) {
      setCardError('분양현장명을 입력해주세요');
      return;
    }
    if (!cardImageFile) {
      setCardError('명함 사진을 업로드해주세요');
      return;
    }

    setIsUploadingCard(true);
    setCardError('');

    try {
      // 명함 이미지 업로드
      const imageUrl = await uploadImage(cardImageFile, 'card-images');
      if (!imageUrl) {
        setCardError('이미지 업로드에 실패했습니다.');
        setIsUploadingCard(false);
        return;
      }

      await updateUserMetadata({
        cardVerified: true,
        cardName: cardName.trim(),
        cardCompany: cardCompany.trim(),
        cardProject: cardProject.trim(),
        cardPhone: cardPhone.trim(),
        cardImageUrl: imageUrl,
      });
      setSuccessMessage('분양현장 명함 인증이 완료되었습니다!');
    } catch (error) {
      console.error('Card save error:', error);
      setCardError('저장 중 오류가 발생했습니다');
    } finally {
      setIsUploadingCard(false);
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

  // 이미 인증된 경우 (추가 인증 폼 미표시 시)
  if (isAlreadyVerified && !showForm) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
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

        <main className="max-w-md mx-auto px-4 py-6 space-y-4">
          {/* 중개업소 인증 */}
          <div className={`bg-white rounded-2xl border overflow-hidden ${
            alreadyBrokerVerified ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className={`px-5 py-3 flex items-center justify-between ${
              alreadyBrokerVerified ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <Building2 className={`w-5 h-5 ${alreadyBrokerVerified ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900">중개업소 인증</span>
              </div>
              {alreadyBrokerVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  인증완료
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  미인증
                </span>
              )}
            </div>
            {alreadyBrokerVerified ? (
              <div className="px-5 py-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">중개사무소명</span>
                  <span className="font-medium text-gray-900">{meta?.brokerOfficeName || ''}</span>
                </div>
                {meta?.brokerRegNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">개설등록번호</span>
                    <span className="font-medium text-gray-900">{meta.brokerRegNo}</span>
                  </div>
                )}
                {meta?.brokerAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">소재지</span>
                    <span className="font-medium text-gray-900 text-right text-xs max-w-[55%]">{meta.brokerAddress}</span>
                  </div>
                )}
                {meta?.brokerRegDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">개설등록일</span>
                    <span className="font-medium text-gray-900">{meta.brokerRegDate}</span>
                  </div>
                )}
                {meta?.brokerTaxEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">세금계산서 이메일</span>
                    <span className="font-medium text-gray-900">{meta.brokerTaxEmail}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400">
                등록된 중개업소 인증 정보가 없습니다.
              </div>
            )}
          </div>

          {/* 사업자 인증 */}
          <div className={`bg-white rounded-2xl border overflow-hidden ${
            alreadyBusinessVerified ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className={`px-5 py-3 flex items-center justify-between ${
              alreadyBusinessVerified ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${alreadyBusinessVerified ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900">사업자 인증</span>
              </div>
              {alreadyBusinessVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  인증완료
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  미인증
                </span>
              )}
            </div>
            {alreadyBusinessVerified ? (
              <div className="px-5 py-4 space-y-2.5 text-sm">
                {meta?.bizName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">상호</span>
                    <span className="font-medium text-gray-900">{meta.bizName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">사업자등록번호</span>
                  <span className="font-medium text-gray-900">{meta?.businessNumber || ''}</span>
                </div>
                {meta?.bizTypeLabel && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">사업자 구분</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      meta.bizType === 'corporate' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {meta.bizTypeLabel}
                    </span>
                  </div>
                )}
                {meta?.bizSector && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">업태</span>
                    <span className="font-medium text-gray-900">{meta.bizSector}</span>
                  </div>
                )}
                {meta?.bizItem && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">종목</span>
                    <span className="font-medium text-gray-900">{meta.bizItem}</span>
                  </div>
                )}
                {meta?.businessTaxType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">과세유형</span>
                    <span className="font-medium text-gray-900 text-xs">{meta.businessTaxType}</span>
                  </div>
                )}
                {meta?.bizEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">세금계산서 이메일</span>
                    <span className="font-medium text-gray-900">{meta.bizEmail}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400">
                등록된 사업자 인증 정보가 없습니다.
              </div>
            )}
          </div>

          {/* 명함 인증 */}
          <div className={`bg-white rounded-2xl border overflow-hidden ${
            alreadyCardVerified ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className={`px-5 py-3 flex items-center justify-between ${
              alreadyCardVerified ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <CreditCard className={`w-5 h-5 ${alreadyCardVerified ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900">명함 인증</span>
              </div>
              {alreadyCardVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  인증완료
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  미인증
                </span>
              )}
            </div>
            {alreadyCardVerified ? (
              <div className="px-5 py-4 space-y-2.5 text-sm">
                {meta?.cardName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">이름</span>
                    <span className="font-medium text-gray-900">{meta.cardName}</span>
                  </div>
                )}
                {meta?.cardCompany && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">소속회사</span>
                    <span className="font-medium text-gray-900">{meta.cardCompany}</span>
                  </div>
                )}
                {meta?.cardProject && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">분양현장</span>
                    <span className="font-medium text-gray-900">{meta.cardProject}</span>
                  </div>
                )}
                {meta?.cardImageUrl && (
                  <div className="pt-1">
                    <img
                      src={meta.cardImageUrl}
                      alt="명함 사진"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400">
                등록된 명함 인증 정보가 없습니다.
              </div>
            )}
          </div>

          {/* 추가 인증 / 액션 버튼 */}
          {(!alreadyBrokerVerified || !alreadyBusinessVerified || !alreadyCardVerified) && (
            <button
              type="button"
              onClick={() => {
                if (!alreadyBrokerVerified) setActiveTab('broker');
                else if (!alreadyBusinessVerified) setActiveTab('business');
                else setActiveTab('card');
                setShowForm(true);
              }}
              className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors text-sm"
            >
              + 추가 인증하기
            </button>
          )}

          <div className="space-y-3 pt-2">
            <Link
              href="/sales/jobs/new"
              className="block w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-center"
            >
              구인글 작성하기
            </Link>
            <Link
              href="/agent/mypage"
              className="block w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-center"
            >
              마이페이지로 돌아가기
            </Link>
          </div>
        </main>
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
            구인글을 작성하려면 인증이 필요합니다.<br />
            <strong>공인중개사 구인</strong>: 중개사무소 등록번호 인증<br />
            <strong>분양상담사 구인</strong>: 사업자등록번호 또는 명함 인증
          </p>
        </div>

        {/* 탭 선택 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('broker')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'broker'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            중개사무소
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'business'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            사업자등록번호
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'card'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            명함 인증
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

              {/* 세금계산서 이메일 */}
              {brokerVerified && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    세금계산서 수신 이메일
                  </label>
                  <input
                    type="email"
                    value={brokerTaxEmail}
                    onChange={(e) => setBrokerTaxEmail(e.target.value)}
                    placeholder="예: tax@company.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">세금계산서 발행 시 사용됩니다.</p>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={(e) => {
                      setBusinessNumber(formatBusinessNumber(e.target.value));
                      setBusinessError('');
                      setBusinessVerified(false);
                    }}
                    placeholder="예: 123-45-67890"
                    maxLength={12}
                    className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      businessError ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={fetchBusinessStatus}
                    disabled={isFetchingBusiness || !businessNumber}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isFetchingBusiness ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    조회
                  </button>
                </div>
                {businessError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {businessError}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  * 국세청에 등록된 사업자등록번호를 입력 후 조회해주세요.
                </p>
              </div>

              {/* 조회 결과 */}
              {businessVerified && (
                <>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">
                        {verificationMethod === 'nts_api' ? '국세청 확인 완료' : '번호 검증 완료'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">사업자등록번호</span>
                      <span className="font-medium text-gray-900">{businessNumber}</span>
                    </div>
                    {bizTypeLabel && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">사업자 구분</span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          bizType === 'corporate'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {bizTypeLabel}
                        </span>
                      </div>
                    )}
                    {verificationMethod === 'nts_api' && businessStatus && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">사업 상태</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {businessStatus}
                        </span>
                      </div>
                    )}
                    {verificationMethod === 'checksum_only' && (
                      <p className="text-xs text-amber-600">
                        * 번호 형식이 확인되었습니다. 국세청 실시간 조회는 준비 중입니다.
                      </p>
                    )}
                  </div>

                  {/* 사업자등록증 추가 정보 입력 */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">사업자등록증 정보 입력</h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상호 (사업자명) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        placeholder="예: 온시아부동산중개"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        업태
                      </label>
                      <input
                        type="text"
                        value={bizSector}
                        onChange={(e) => setBizSector(e.target.value)}
                        placeholder="예: 부동산업"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['부동산업', '서비스업', '건설업', '도소매업'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setBizSector(s)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              bizSector === s
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        종목
                      </label>
                      <input
                        type="text"
                        value={bizItem}
                        onChange={(e) => setBizItem(e.target.value)}
                        placeholder="예: 부동산 중개"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['부동산 중개', '분양대행', '부동산 개발', '부동산 컨설팅', '부동산 임대'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setBizItem(item)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              bizItem === item
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        세금계산서 수신 이메일
                      </label>
                      <input
                        type="email"
                        value={bizEmail}
                        onChange={(e) => setBizEmail(e.target.value)}
                        placeholder="예: tax@company.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">세금계산서 발행 시 사용됩니다.</p>
                    </div>
                  </div>
                </>
              )}

              {/* 휴업/폐업/미등록인 경우 상태 표시 */}
              {!businessVerified && businessStatusCode && (
                <div className={`p-4 rounded-xl border space-y-2 mb-4 ${
                  businessStatusCode === '02'
                    ? 'bg-yellow-50 border-yellow-200'
                    : businessStatusCode === '03'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-5 h-5 ${
                      businessStatusCode === '02' ? 'text-yellow-600' :
                      businessStatusCode === '03' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                    <span className="font-medium text-gray-900">
                      {businessStatusCode === '02' ? '휴업자' :
                       businessStatusCode === '03' ? '폐업자' : '미등록'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    영업 중인 사업자(계속사업자)만 인증이 가능합니다.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleBusinessSubmit}
                disabled={!businessVerified || isSubmitting}
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
        {/* 명함 인증 탭 */}
        {activeTab === 'card' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                분양현장 명함 인증
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                분양현장에서 받은 명함을 촬영하여 업로드해주세요. 분양상담사 구인글 작성이 가능합니다.
              </p>

              {/* 명함 사진 업로드 */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  명함 사진 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCardImageChange}
                  className="hidden"
                  id="card-image-input"
                />
                {cardImagePreview ? (
                  <div className="relative">
                    <img
                      src={cardImagePreview}
                      alt="명함 미리보기"
                      className="w-full h-48 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => { setCardImageFile(null); setCardImagePreview(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="card-image-input"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
                  >
                    <Camera className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">명함 사진 업로드</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (최대 2MB)</p>
                  </label>
                )}
              </div>

              {/* 정보 입력 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="명함에 표기된 이름"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    소속회사 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardCompany}
                    onChange={(e) => setCardCompany(e.target.value)}
                    placeholder="예: (주)온시아분양대행"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    분양현장명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardProject}
                    onChange={(e) => setCardProject(e.target.value)}
                    placeholder="예: 힐스테이트 잠실 포레"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <input
                    type="tel"
                    value={cardPhone}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, '');
                      if (v.length > 11) v = v.slice(0, 11);
                      if (v.length > 7) v = `${v.slice(0,3)}-${v.slice(3,7)}-${v.slice(7)}`;
                      else if (v.length > 3) v = `${v.slice(0,3)}-${v.slice(3)}`;
                      setCardPhone(v);
                    }}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {cardError && (
                <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {cardError}
                </p>
              )}

              <button
                type="button"
                onClick={handleCardSubmit}
                disabled={isUploadingCard || isSubmitting}
                className="w-full mt-5 py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isUploadingCard ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  '명함 인증 완료'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
