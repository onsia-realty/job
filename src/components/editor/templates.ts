export interface EditorTemplate {
  id: string;
  name: string;
  description: string;
  category: 'agent' | 'sales' | 'common';
  html: string;
}

export const JOB_TEMPLATES: EditorTemplate[] = [
  {
    id: 'agent-basic',
    name: '스타일 1',
    description: '기본 구인공고',
    category: 'agent',
    html: `<h2>📋 모집 개요</h2>
<table>
  <tbody>
    <tr><th>모집분야</th><td></td></tr>
    <tr><th>담당업무</th><td></td></tr>
    <tr><th>근무지역</th><td></td></tr>
    <tr><th>근무시간</th><td></td></tr>
    <tr><th>급여조건</th><td></td></tr>
    <tr><th>경력조건</th><td></td></tr>
  </tbody>
</table>

<h2>🏢 회사 소개</h2>
<p></p>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>✅ 우대 조건</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>🎁 복리후생</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
  <li></li>
</ul>
`,
  },
  {
    id: 'agent-albamon',
    name: '스타일 2',
    description: '표 중심 상세 양식',
    category: 'agent',
    html: `<h2>📌 모집 내용</h2>
<table>
  <tbody>
    <tr><th>모집직종</th><td></td></tr>
    <tr><th>고용형태</th><td></td></tr>
    <tr><th>모집인원</th><td></td></tr>
    <tr><th>모집마감</th><td></td></tr>
  </tbody>
</table>

<h2>💰 급여 조건</h2>
<table>
  <tbody>
    <tr><th>급여형태</th><td></td></tr>
    <tr><th>급여액</th><td></td></tr>
    <tr><th>인센티브</th><td></td></tr>
    <tr><th>지급방식</th><td></td></tr>
  </tbody>
</table>

<h2>⏰ 근무 조건</h2>
<table>
  <tbody>
    <tr><th>근무요일</th><td></td></tr>
    <tr><th>근무시간</th><td></td></tr>
    <tr><th>휴게시간</th><td></td></tr>
    <tr><th>근무지역</th><td></td></tr>
  </tbody>
</table>

<h2>📝 자격 요건</h2>
<table>
  <tbody>
    <tr><th>학력</th><td></td></tr>
    <tr><th>경력</th><td></td></tr>
    <tr><th>우대사항</th><td></td></tr>
  </tbody>
</table>

<h2>🎁 복리후생</h2>
<p></p>

`,
  },
  {
    id: 'agent-jobkorea',
    name: '스타일 3',
    description: '섹션 나누기 양식',
    category: 'agent',
    html: `<h2>회사소개</h2>
<p></p>

<hr />

<h2>모집부문 및 자격요건</h2>
<table>
  <thead>
    <tr><th>모집부문</th><th>담당업무</th><th>자격요건</th></tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>

<hr />

<h2>근무조건</h2>
<ul>
  <li><strong>고용형태:</strong> </li>
  <li><strong>급여:</strong> </li>
  <li><strong>근무시간:</strong> </li>
  <li><strong>근무요일:</strong> </li>
  <li><strong>근무지역:</strong> </li>
</ul>

<hr />

<h2>복리후생</h2>
<ul>
  <li><strong>급여제도:</strong> </li>
  <li><strong>지원금/보험:</strong> </li>
  <li><strong>편의시설:</strong> </li>
  <li><strong>교육/생활:</strong> </li>
  <li><strong>조직문화:</strong> </li>
</ul>

<hr />

<h2>전형절차</h2>
<p><strong>서류전형</strong> → <strong>면접</strong> → <strong>최종합격</strong></p>
<p></p>`,
  },
  {
    id: 'sales-basic',
    name: '스타일 1',
    description: '기본 분양공고',
    category: 'sales',
    html: `<h2>📋 현장 소개</h2>
<table>
  <tbody>
    <tr><th>현장명</th><td></td></tr>
    <tr><th>현장유형</th><td></td></tr>
    <tr><th>총 세대수</th><td></td></tr>
    <tr><th>현장위치</th><td></td></tr>
    <tr><th>분양시기</th><td></td></tr>
  </tbody>
</table>

<h2>💰 수수료 조건</h2>
<table>
  <tbody>
    <tr><th>수수료</th><td></td></tr>
    <tr><th>지급시기</th><td></td></tr>
    <tr><th>추가혜택</th><td></td></tr>
  </tbody>
</table>

<h2>👥 모집 조건</h2>
<ul>
  <li><strong>모집직급:</strong> </li>
  <li><strong>모집인원:</strong> </li>
  <li><strong>경력조건:</strong> </li>
</ul>

<h2>🎁 복리후생</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
  <li></li>
</ul>
`,
  },
  {
    id: 'sales-albamon',
    name: '스타일 2',
    description: '표 중심 분양 양식',
    category: 'sales',
    html: `<h2>📌 현장 정보</h2>
<table>
  <tbody>
    <tr><th>현장명</th><td></td></tr>
    <tr><th>시행사</th><td></td></tr>
    <tr><th>시공사</th><td></td></tr>
    <tr><th>현장유형</th><td></td></tr>
    <tr><th>현장위치</th><td></td></tr>
  </tbody>
</table>

<h2>💰 급여 및 수수료</h2>
<table>
  <tbody>
    <tr><th>급여형태</th><td></td></tr>
    <tr><th>수수료</th><td></td></tr>
    <tr><th>지급시기</th><td></td></tr>
    <tr><th>정산방법</th><td></td></tr>
  </tbody>
</table>

<h2>👥 모집 내용</h2>
<table>
  <tbody>
    <tr><th>모집직급</th><td></td></tr>
    <tr><th>모집인원</th><td></td></tr>
    <tr><th>경력조건</th><td></td></tr>
    <tr><th>근무기간</th><td></td></tr>
  </tbody>
</table>

<h2>🎁 복리후생</h2>
<p></p>

<h2>🔥 현장 특징</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
  <li></li>
</ul>

`,
  },
  {
    id: 'sales-jobkorea',
    name: '스타일 3',
    description: '섹션 나누기 분양 양식',
    category: 'sales',
    html: `<h2>현장소개</h2>
<p></p>

<hr />

<h2>모집부문 및 조건</h2>
<table>
  <thead>
    <tr><th>모집직급</th><th>수수료</th><th>자격요건</th></tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>

<hr />

<h2>현장 상세</h2>
<ul>
  <li><strong>현장명:</strong> </li>
  <li><strong>세대수:</strong> </li>
  <li><strong>분양가:</strong> </li>
  <li><strong>입주예정:</strong> </li>
  <li><strong>위치:</strong> </li>
</ul>

<hr />

<h2>복리후생</h2>
<ul>
  <li><strong>숙소:</strong> </li>
  <li><strong>일비:</strong> </li>
  <li><strong>식대:</strong> </li>
  <li><strong>교통:</strong> </li>
  <li><strong>기타:</strong> </li>
</ul>

<hr />

<h2>전형절차</h2>
<p></p>`,
  },
];

export function getTemplatesByCategory(category: 'agent' | 'sales'): EditorTemplate[] {
  return JOB_TEMPLATES.filter(t => t.category === category || t.category === 'common');
}
