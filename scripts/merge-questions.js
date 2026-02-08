// Q&A(1).MD 파일을 파싱하여 dnaQuestions.ts에 병합하는 스크립트
const fs = require('fs');
const path = require('path');

// Q&A(1).MD 읽기
const qaPath = path.join(__dirname, '../../Q&A(1).MD');
const rawContent = fs.readFileSync(qaPath, 'utf-8');

// 파일 구조: 4개 배열이 별도로 존재
// 1) 리스크: 줄 1-1044 (plain array [...])
// 2) 환경: export const environmentQuestions = [...]
// 3) 설득: export const persuasionQuestions = [...]
// 4) 회복탄력성: export const resilienceQuestions = [...]

// export 구문 제거하고 파싱 가능하게 변환
const cleanContent = rawContent
  .replace(/export\s+const\s+\w+\s*=\s*/g, '')  // export const xxx = 제거
  .replace(/\/\/.*$/gm, '');  // 주석 제거

// 4개 배열을 하나로 합치기
// ];  [  또는 ] [ 패턴을 , 로 연결
const merged = cleanContent
  .replace(/\]\s*;?\s*\[/g, ',');  // ]; [ 또는 ][ 를 , 로 연결

let newQuestions;
try {
  newQuestions = new Function('return ' + merged)();
  console.log(`총 ${newQuestions.length}개 신규 질문 파싱 완료`);
} catch (e) {
  console.error('파싱 에러:', e.message);
  // 디버그: 에러 위치 주변 출력
  const errMatch = e.message.match(/position (\d+)/);
  if (errMatch) {
    const pos = parseInt(errMatch[1]);
    console.error('에러 위치 주변:', merged.substring(pos - 50, pos + 50));
  }
  process.exit(1);
}

// 카테고리별 분류
const byCategory = {};
for (const q of newQuestions) {
  const key = q.categoryKey;
  if (!byCategory[key]) byCategory[key] = [];
  byCategory[key].push(q);
}

console.log('\n카테고리별 신규 질문 수:');
for (const [key, questions] of Object.entries(byCategory)) {
  console.log(`  ${key}: ${questions.length}개`);
}

// 기존 dnaQuestions.ts 읽기
const tsPath = path.join(__dirname, '../src/data/dnaQuestions.ts');
let tsContent = fs.readFileSync(tsPath, 'utf-8');

// 각 카테고리별로 기존 배열 끝에 새 질문 삽입
for (const [categoryKey, questions] of Object.entries(byCategory)) {
  // 카테고리 배열의 끝 찾기: "  ],\n\n  // ========== N+1." 또는 끝에서 "];"
  // 더 정확한 패턴: 해당 카테고리 섹션의 마지막 "]," 찾기

  // 질문을 TypeScript 포맷으로 변환
  const questionsTs = questions.map(q => {
    const optionsStr = q.options.map(opt => {
      const scoresStr = `{ risk: ${opt.scores.risk}, social: ${opt.scores.social}, logic: ${opt.scores.logic}, resilience: ${opt.scores.resilience} }`;
      return `        { id: '${opt.id}', text: '${opt.text.replace(/'/g, "\\'")}', label: '${opt.label.replace(/'/g, "\\'")}', scores: ${scoresStr} }`;
    }).join(',\n');

    return `    {\n      id: '${q.id}',\n      category: '${q.category}',\n      categoryKey: '${q.categoryKey}',\n      question: '${q.question.replace(/'/g, "\\'")}',\n      options: [\n${optionsStr},\n      ],\n    }`;
  }).join(',\n');

  console.log(`\n${categoryKey}: ${questions.length}개 질문 변환 완료`);

  // 해당 카테고리의 마지막 질문 뒤에 삽입
  // 패턴: categoryKey가 속한 섹션의 "],\n" 찾기
  // 각 카테고리 배열의 끝 패턴: "  ],\n\n  // ==========" (다음 섹션 시작)
  // 마지막 카테고리면: "  ],\n};"

  // 카테고리 헤더 찾기
  const categoryHeaders = {
    risk: '리스크 감수성',
    environment: '업무 환경 적응력',
    persuasion: '설득/영업 스타일',
    resilience: '회복탄력성',
    money: '금전 감각',
    learning: '학습/성장 성향',
    networking: '네트워킹 스타일',
    motivation: '동기 부여 요인',
    future: '미래 비전',
    selfImage: '자기 인식'
  };

  // categoryKey: [ 배열 끝의 ],\n\n 패턴 찾기
  // 해당 카테고리의 배열 시작 위치 찾기
  const categoryStart = tsContent.indexOf(`  ${categoryKey}: [`);
  if (categoryStart === -1) {
    console.error(`카테고리 '${categoryKey}' 를 찾을 수 없음`);
    continue;
  }

  // 해당 카테고리 배열의 끝 찾기 (  ],)
  let depth = 0;
  let pos = tsContent.indexOf('[', categoryStart);
  let arrayEnd = -1;

  for (let i = pos; i < tsContent.length; i++) {
    if (tsContent[i] === '[') depth++;
    else if (tsContent[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    console.error(`카테고리 '${categoryKey}' 배열 끝을 찾을 수 없음`);
    continue;
  }

  // 기존 마지막 요소 뒤에 새 질문 삽입
  // arrayEnd 위치의 ] 바로 앞에 삽입
  const insertPoint = arrayEnd;
  const before = tsContent.substring(0, insertPoint);
  const after = tsContent.substring(insertPoint);

  // 기존 배열이 비어있지 않으면 쉼표 추가
  tsContent = before + ',\n' + questionsTs + ',\n  ' + after;

  console.log(`  → '${categoryKey}' 카테고리에 ${questions.length}개 질문 삽입 완료`);
}

// 파일 상단 주석 업데이트
tsContent = tsContent.replace(
  '// 부동산 DNA 분석 질문 풀 (100개)',
  '// 부동산 DNA 분석 질문 풀 (410개)'
);
tsContent = tsContent.replace(
  '// 카테고리별 10개씩, 랜덤으로 10개 선택',
  '// 카테고리별 10~100개씩, 랜덤으로 10개 선택'
);

// 저장
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log('\n✅ dnaQuestions.ts 업데이트 완료!');

// 검증: 각 카테고리별 질문 수 확인
const counts = {};
const idPattern = /id: '(\w+?)_\d+'/g;
let match;
while ((match = idPattern.exec(tsContent)) !== null) {
  const cat = match[1];
  counts[cat] = (counts[cat] || 0) + 1;
}
console.log('\n최종 카테고리별 질문 수:');
let total = 0;
for (const [key, count] of Object.entries(counts).sort()) {
  console.log(`  ${key}: ${count}개`);
  total += count;
}
console.log(`  합계: ${total}개`);
