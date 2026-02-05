'use client';

interface ContactSectionProps {
  contactName: string;
  phone: string;
  officePhone?: string;
  onContactNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOfficePhoneChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accentColor?: string;
}

export default function ContactSection({
  contactName,
  phone,
  officePhone = '',
  onContactNameChange,
  onPhoneChange,
  onOfficePhoneChange,
  accentColor = 'blue',
}: ContactSectionProps) {
  const focusBorder = accentColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-blue-500';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            담당자명
          </label>
          <input
            type="text"
            name="contact_name"
            value={contactName}
            onChange={onContactNameChange}
            placeholder="예: 홍길동"
            className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none ${focusBorder}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            휴대폰 <span className="text-xs text-gray-400">(마스킹 처리됨)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={onPhoneChange}
            placeholder="010-0000-0000"
            maxLength={13}
            className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none ${focusBorder}`}
          />
        </div>
      </div>
      {onOfficePhoneChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회사 전화번호 <span className="text-xs text-gray-400">(지역번호 포함, 그대로 노출)</span>
          </label>
          <input
            type="tel"
            name="office_phone"
            value={officePhone}
            onChange={onOfficePhoneChange}
            placeholder="02-1234-5678"
            maxLength={14}
            className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none ${focusBorder}`}
          />
        </div>
      )}
    </div>
  );
}
