import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/shared/Header';
import StayRequestsClient from './StayRequestsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '내 등록 신청 | 부인 STAY' };

export default function StayRequestsPage() {
  if (process.env.NEXT_PUBLIC_STAY_ENABLED !== 'true') redirect('/');
  return <div className="min-h-screen bg-slate-50"><Header variant="landing" /><StayRequestsClient /></div>;
}
