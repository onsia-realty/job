// 고객센터 챗봇 AI 답변 캐시 (메모리 LRU + TTL)
//
// 주의: 서버리스 인스턴스마다 따로 존재하는 best-effort 캐시예요.
// 인스턴스가 식거나 새로 뜨면 비어 있고, 인스턴스 간 공유되지 않아요 (Gemini 호출을 "줄이는" 용도일 뿐 보장 아님).
// 저장 대상: 비로그인 + 첫 턴(이전 대화 없음) + 핸드오프가 아닌 AI 답변만 — 개인 정보·대화 맥락이 섞이지 않게.

import { normalizeQuestion } from '@/lib/support-faq';

export interface AnswerCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
  now?: () => number;
}

interface Entry {
  answer: string;
  expiresAt: number;
}

export class AnswerCache {
  private readonly map = new Map<string, Entry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(opts: AnswerCacheOptions = {}) {
    this.maxEntries = opts.maxEntries ?? 200;
    this.ttlMs = opts.ttlMs ?? 60 * 60 * 1000;
    this.now = opts.now ?? Date.now;
  }

  static key(question: string): string {
    return normalizeQuestion(question);
  }

  get(question: string): string | null {
    const key = AnswerCache.key(question);
    if (!key) return null;
    const hit = this.map.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= this.now()) {
      this.map.delete(key);
      return null;
    }
    // LRU: 최근 사용으로 이동
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.answer;
  }

  set(question: string, answer: string): void {
    const key = AnswerCache.key(question);
    if (!key || !answer) return;
    this.map.delete(key);
    this.map.set(key, { answer, expiresAt: this.now() + this.ttlMs });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

/** 캐시를 읽고 써도 되는 대화인지 — 비로그인 + 첫 턴만 */
export function isCacheable(input: { hasHistory: boolean; loggedIn: boolean }): boolean {
  return !input.hasHistory && !input.loggedIn;
}
