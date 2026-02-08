'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const STEPS = [
  { label: '사진 분석 중...', duration: 3000 },
  { label: '스타일 적용 중...', duration: 6000 },
  { label: '세부 보정 중...', duration: 4000 },
  { label: '마무리 중...', duration: 2000 },
];

export default function GenerationProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until complete
        return prev + 0.5;
      });
    }, 150);

    // Cycle through steps
    let stepTimeout: NodeJS.Timeout;
    const advanceStep = (step: number) => {
      if (step >= STEPS.length) {
        // Loop back to the last step
        return;
      }
      setCurrentStep(step);
      stepTimeout = setTimeout(() => advanceStep(step + 1), STEPS[step].duration);
    };

    advanceStep(0);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {/* Animated icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
        </div>
      </div>

      {/* Step label */}
      <p className="text-lg font-semibold text-gray-800 mb-2 transition-all duration-300">
        {STEPS[currentStep]?.label || '마무리 중...'}
      </p>
      <p className="text-sm text-gray-400 mb-6">약 10~15초 소요됩니다</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{Math.round(progress)}%</p>
    </div>
  );
}
