'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
export default function StayInquiryForm({ stayId, contextMessage = '' }: { stayId: string; contextMessage?: string }) {
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [sent, setSent] = useState(false);
  const combinedMessage = contextMessage ? `${message}\n\n${contextMessage}` : message;
  const messageLimit = Math.max(0, 1000 - (contextMessage ? contextMessage.length + 2 : 0));
  if (!session) return <p className="p-4 text-sm"><Link className="text-blue-700 underline" href="/agent/auth/login">로그인</Link> 후 문의할 수 있습니다.</p>;
  return <form className="space-y-3 rounded-xl bg-slate-50 p-4" onSubmit={async e => {
    e.preventDefault(); if (busy || sent) return;
    if (combinedMessage.length > 1000) { setNotice('날짜·금액 정보를 포함해 1,000자 이하로 작성해주세요.'); return; }
    setBusy(true); setNotice('');
    try {
      const res = await fetch('/api/stay-inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ stay_id: stayId, message: combinedMessage, consent }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '문의 접수에 실패했습니다.');
      setSent(true); setNotice('문의가 저장되었습니다. 문의함에서 답변을 확인해주세요.');
    } catch (error) { setNotice(error instanceof Error ? error.message : '연결 상태를 확인해주세요.'); }
    finally { setBusy(false); }
  }}>
    {!sent && <><label className="block text-sm font-bold">입주 문의<textarea required minLength={10} maxLength={messageLimit} value={message} onChange={e => setMessage(e.target.value)} placeholder="희망 입주일, 이용 기간, 인원 등을 적어주세요. 전화번호 등 개인정보는 적지 마세요." className="mt-2 h-28 w-full rounded-lg border p-3 font-normal" /></label>
    {contextMessage && <p className="whitespace-pre-line text-xs text-slate-600">문의에 함께 전달됩니다: {contextMessage}</p>}
    <label className="flex gap-2 text-xs"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />문의 처리 목적으로 내용을 매물 등록자와 운영자가 열람하는 데 동의합니다.</label>
    <button disabled={busy || combinedMessage.length > 1000} className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white disabled:opacity-50">{busy ? '접수 중…' : '문의 보내기'}</button></>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    <Link className="block text-sm text-blue-700 underline" href="/stay/inquiries">내 문의함</Link>
  </form>;
}
