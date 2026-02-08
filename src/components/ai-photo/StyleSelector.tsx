'use client';

import { Briefcase, Mic, Smile } from 'lucide-react';
import type { AiPhotoStyle } from '@/lib/ai-photo-styles';
import { STYLE_INFO } from '@/lib/ai-photo-styles';

interface StyleSelectorProps {
  selectedStyle: AiPhotoStyle | null;
  onStyleSelect: (style: AiPhotoStyle) => void;
  disabled?: boolean;
}

const STYLE_ICONS: Record<AiPhotoStyle, typeof Briefcase> = {
  BUSINESS_SUIT: Briefcase,
  ANNOUNCER: Mic,
  CASUAL: Smile,
};

const STYLE_COLORS: Record<AiPhotoStyle, { bg: string; border: string; icon: string; text: string }> = {
  BUSINESS_SUIT: {
    bg: 'bg-blue-50',
    border: 'border-blue-200 hover:border-blue-400',
    icon: 'text-blue-600 bg-blue-100',
    text: 'text-blue-900',
  },
  ANNOUNCER: {
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-400',
    icon: 'text-purple-600 bg-purple-100',
    text: 'text-purple-900',
  },
  CASUAL: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200 hover:border-emerald-400',
    icon: 'text-emerald-600 bg-emerald-100',
    text: 'text-emerald-900',
  },
};

const styles: AiPhotoStyle[] = ['BUSINESS_SUIT', 'ANNOUNCER', 'CASUAL'];

export default function StyleSelector({ selectedStyle, onStyleSelect, disabled }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {styles.map((style) => {
        const Icon = STYLE_ICONS[style];
        const info = STYLE_INFO[style];
        const colors = STYLE_COLORS[style];
        const isSelected = selectedStyle === style;

        return (
          <button
            key={style}
            onClick={() => onStyleSelect(style)}
            disabled={disabled}
            className={`
              relative p-5 rounded-2xl border-2 transition-all duration-200 text-left
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected
                ? `${colors.bg} border-blue-600 ring-2 ring-blue-600/20 shadow-md`
                : `bg-white ${colors.border} shadow-sm hover:shadow-md`
              }
            `}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colors.icon}`}>
              <Icon className="w-6 h-6" />
            </div>

            <h3 className={`font-bold text-lg mb-1 ${colors.text}`}>
              {info.label}
            </h3>
            <p className="text-gray-500 text-sm">
              {info.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
