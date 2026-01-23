'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

const PROPERTY_TYPES = ['아파트', '상가', '오피스', '빌라', '원룸', '토지', '주택', '분양'];

export default function Step2EmployerPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [brokerageNumber, setBrokerageNumber] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const formatOfficePhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddressSearch = () => {
    // 카카오 주소 API 연동 (추후 구현)
    // 현재는 placeholder
    if (typeof window !== 'undefined' && (window as any).daum?.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          setAddress(data.address);
        },
      }).open();
    } else {
      alert('주소 검색 서비스 준비 중입니다.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !businessNumber || !address) {
      alert('필수 항목을 입력해주세요.');
      return;
    }
    // 실제로는 API 호출
    console.log({
      companyName,
      businessNumber,
      brokerageNumber,
      address,
      addressDetail,
      phone,
      propertyTypes,
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/auth/signup"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              뒤로
            </Link>
            <h2 className="text-lg font-bold text-gray-900">사무소 정보 입력</h2>
            <span className="w-10" />
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-8">
            <div className="w-full h-full bg-blue-600 rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-sm font-bold text-gray-800">중개사무소 정보</h3>

            {/* 상호명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                상호명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: 강남센트럴공인중개사사무소"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 사업자등록번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사업자등록번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(formatBusinessNumber(e.target.value))}
                placeholder="000-00-00000"
                maxLength={12}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 중개사무소 등록번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                중개사무소 등록번호
              </label>
              <input
                type="text"
                value={brokerageNumber}
                onChange={(e) => setBrokerageNumber(e.target.value)}
                placeholder="중개사무소 등록번호"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 사무소 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사무소 주소 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={address}
                  readOnly
                  placeholder="주소 검색"
                  className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl text-sm bg-gray-50 cursor-pointer focus:outline-none"
                  onClick={handleAddressSearch}
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <Search className="w-4.5 h-4.5 text-gray-600" />
                </button>
              </div>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세주소"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 대표 연락처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                대표 연락처
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatOfficePhone(e.target.value))}
                placeholder="02-0000-0000"
                maxLength={13}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 주요 취급 물건 */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                주요 취급 물건
                <span className="text-xs font-normal text-gray-400 ml-2">(복수 선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePropertyType(type)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      propertyTypes.includes(type)
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              가입 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
