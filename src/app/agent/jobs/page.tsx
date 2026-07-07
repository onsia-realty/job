import { redirect } from 'next/navigation';

// 공인중개사 목록(/agent/jobs)은 새 공고 메인(/agent)으로 통합됨.
// 상세(/agent/jobs/[id]) · 등록(/agent/jobs/new) 등 하위 라우트는 그대로 유지.
export default function AgentJobsRedirect() {
  redirect('/agent');
}
