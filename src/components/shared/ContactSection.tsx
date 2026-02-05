'use client';

interface ContactSectionProps {
  contactName: string;
  phone: string;
  onContactNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accentColor?: string;
}

export default function ContactSection({
  contactName,
  phone,
  onContactNameChange,
  onPhoneChange,
  accentColor = 'blue',
}: ContactSectionProps) {
  const focusBorder = accentColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-blue-500';

  return (
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
          연락처
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
  );
}
