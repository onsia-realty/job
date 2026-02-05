'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
  children: ReactNode;
}

export default function FormSection({
  icon: Icon,
  title,
  iconColor = 'text-blue-600',
  children,
}: FormSectionProps) {
  return (
    <section className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h2>
      {children}
    </section>
  );
}
