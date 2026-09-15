'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { StayInquiry } from '@/lib/stay/inquiry';
export default function StayInquiriesPage() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [items, setItems] = useState<StayInquiry[]>([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!token) return; setLoading(true); setNotice('');
    try {
      const res = await fetch('/api/stay-inquiries', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setItems(data.inquiries);
    } catch (e) { setNotice(e instanceof Error ? e.message : '문의함을 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { if (!token) { setItems([]); return; } void load(); }, [token, load]);
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
    <Link href="/stay" className="text-blue-700">← 단기임대</Link><h1 className="text-2xl font-bold">문의함</h1>
    <p className="text-sm text-slate-500">보낸 문의와 내 매물에 받은 문의, 최근 100건입니다. 답변은 이 화면에서 확인해주세요.</p>
    {!token ? <Link href="/agent/auth/login" className="text-blue-700 underline">로그인하고 문의 확인</Link> : <button onClick={() => void load()} disabled={loading} className="rounded-lg border p-2">새로고침</button>}
    {notice && <p role="alert">{notice}</p>}{loading && <p>불러오는 중…</p>}
    {token && !loading && !notice && items.length === 0 && <p>아직 문의가 없습니다.</p>}
    {items.map(item => <article key={item.id} className="space-y-3 rounded-2xl border bg-white p-5">
      <p className="text-xs text-blue-700">{item.is_host ? '받은 문의' : '보낸 문의'} · {new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
      <Link href={`/stay/${item.stay_id}`} className="font-bold">{item.stay_title}</Link><p className="whitespace-pre-wrap break-words">{item.message}</p>
      {item.reply && <div className="rounded-lg bg-blue-50 p-3"><strong>답변</strong><p className="whitespace-pre-wrap break-words">{item.reply}</p></div>}
      {item.is_host && <form onSubmit={async e => {
        e.preventDefault(); if (busy) return;
        const reply = String(new FormData(e.currentTarget).get('reply') ?? ''); setBusy(item.id); setNotice('');
        try {
          const res = await fetch('/api/stay-inquiries', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: item.id, reply }) });
          const data = await res.json(); if (!res.ok) throw new Error(data.error); await load();
        } catch (e) { setNotice(e instanceof Error ? e.message : '답변 저장 실패'); } finally { setBusy(null); }
      }}><textarea aria-label="문의 답변" name="reply" required maxLength={1000} defaultValue={item.reply ?? ''} placeholder="답변을 입력해주세요. 개인정보는 적지 마세요." className="w-full rounded-lg border p-3" /><button disabled={busy !== null} className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy === item.id ? '저장 중…' : '답변 저장'}</button></form>}
    </article>)}
  </main>;
}
