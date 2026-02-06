// 부동산 DNA 분석 질문 풀 (100개)
// 카테고리별 10개씩, 랜덤으로 10개 선택

export interface DNAQuestion {
  id: string;
  category: string;
  categoryKey: string;
  question: string;
  options: {
    id: string;
    text: string;
    label: string;
    scores: { risk: number; social: number; logic: number; resilience: number };
  }[];
}

// 카테고리별 질문 풀
const QUESTION_POOL: Record<string, DNAQuestion[]> = {
  // ========== 1. 리스크 감수성 (10개) ==========
  risk: [
    {
      id: 'risk_1',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '오늘 당장 입사 계약서를 쓴다면, 어떤 조건을 선택하시겠습니까?',
      options: [
        { id: 'A', text: '마음 편한 게 최고! 기본급 250만 원 + 인센티브 5%', label: '안정형', scores: { risk: -2, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '적당한 긴장감! 기본급 150만 원 + 인센티브 20%', label: '밸런스형', scores: { risk: 1, social: 0, logic: 0, resilience: 1 } },
        { id: 'C', text: '인생은 한방! 기본급 0원 + 인센티브 50%', label: '야수형', scores: { risk: 3, social: 0, logic: -1, resilience: 2 } },
      ],
    },
    {
      id: 'risk_2',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '경매로 나온 급매물, 시세보다 30% 저렴합니다. 하지만 권리관계가 복잡합니다.',
      options: [
        { id: 'A', text: '위험해 보여서 패스. 안전한 물건만 본다', label: '신중형', scores: { risk: -2, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '전문가 자문 받고 검토해본다', label: '분석형', scores: { risk: 1, social: 1, logic: 2, resilience: 1 } },
        { id: 'C', text: '이런 게 대박 기회지! 바로 입찰 준비', label: '도전형', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'risk_3',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '새로운 신도시 분양 현장이 오픈했습니다. 당신의 선택은?',
      options: [
        { id: 'A', text: '기존 검증된 구도심 매물에 집중한다', label: '보수형', scores: { risk: -2, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '시장 반응을 좀 보고 진입한다', label: '관망형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '선점 효과! 바로 달려간다', label: '선점형', scores: { risk: 3, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'risk_4',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '월 수입이 불규칙한 직업에 대해 어떻게 생각하시나요?',
      options: [
        { id: 'A', text: '절대 못 해. 매달 정해진 월급이 필요해', label: '안정추구', scores: { risk: -3, social: 0, logic: 1, resilience: -1 } },
        { id: 'B', text: '평균적으로 괜찮으면 감수할 수 있어', label: '유연형', scores: { risk: 1, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '오히려 좋아! 노력한 만큼 버는 게 공정해', label: '성과형', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'risk_5',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '큰 계약이 성사 직전인데, 더 좋은 조건의 다른 매물이 나왔습니다.',
      options: [
        { id: 'A', text: '지금 손에 있는 새가 확실해. 현재 계약 진행', label: '확실형', scores: { risk: -2, social: 1, logic: 1, resilience: 0 } },
        { id: 'B', text: '고객에게 솔직히 말하고 선택하게 한다', label: '정직형', scores: { risk: 0, social: 2, logic: 1, resilience: 1 } },
        { id: 'C', text: '두 마리 토끼를 다 잡아본다', label: '욕심형', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'risk_6',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '부동산 시장이 하락세입니다. 당신의 전략은?',
      options: [
        { id: 'A', text: '시장이 안정될 때까지 관망한다', label: '수비형', scores: { risk: -2, social: 0, logic: 2, resilience: 0 } },
        { id: 'B', text: '급매물 위주로 선별적으로 접근한다', label: '선별형', scores: { risk: 1, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '남들이 팔 때가 기회! 적극 매수', label: '역발상', scores: { risk: 3, social: 0, logic: 1, resilience: 3 } },
      ],
    },
    {
      id: 'risk_7',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '전혀 모르는 새로운 지역에서 일해볼 기회가 생겼습니다.',
      options: [
        { id: 'A', text: '내가 잘 아는 지역에서 계속 일하는 게 낫다', label: '전문화', scores: { risk: -2, social: 0, logic: 2, resilience: 0 } },
        { id: 'B', text: '충분히 공부하고 천천히 진입한다', label: '준비형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '새로운 도전이 설렌다! 바로 시작', label: '모험형', scores: { risk: 3, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'risk_8',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '독립해서 내 사무실을 차릴 기회입니다. 자금은 대출이 필요합니다.',
      options: [
        { id: 'A', text: '빚지고 시작하긴 싫어. 더 모아서 하자', label: '무차입', scores: { risk: -3, social: 0, logic: 2, resilience: 0 } },
        { id: 'B', text: '적정 수준의 대출은 레버리지라고 생각한다', label: '레버리지', scores: { risk: 1, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '기회가 왔을 때 잡아야지! 대출 ㄱㄱ', label: '공격형', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'risk_9',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '고객이 파격적인 조건을 요구합니다. 성사되면 수수료가 큽니다.',
      options: [
        { id: 'A', text: '무리한 조건은 거절한다. 원칙이 중요', label: '원칙형', scores: { risk: -2, social: 1, logic: 2, resilience: 0 } },
        { id: 'B', text: '협상해서 서로 윈윈할 수 있는 선을 찾는다', label: '협상형', scores: { risk: 1, social: 2, logic: 1, resilience: 1 } },
        { id: 'C', text: '일단 수락하고 어떻게든 맞춰본다', label: '승부형', scores: { risk: 3, social: 1, logic: -1, resilience: 2 } },
      ],
    },
    {
      id: 'risk_10',
      category: '리스크 감수성',
      categoryKey: 'risk',
      question: '투자 성향 테스트에서 당신은 어떤 유형일 것 같나요?',
      options: [
        { id: 'A', text: '안정형 - 원금 보장이 최우선', label: '안정형', scores: { risk: -3, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '중립형 - 적당한 수익과 적당한 리스크', label: '중립형', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '공격형 - 하이리스크 하이리턴!', label: '공격형', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
  ],

  // ========== 2. 업무 환경 (10개) ==========
  environment: [
    {
      id: 'env_1',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '출근 첫날, 대표님이 "자네, 오늘 뭐부터 할래?"라고 묻습니다.',
      options: [
        { id: 'A', text: '"일단 사무실 분위기부터 익히겠습니다." (컴퓨터 세팅 & 매물 장부 정리)', label: '신중형', scores: { risk: -1, social: -1, logic: 1, resilience: 0 } },
        { id: 'B', text: '"선배님 따라 현장 답사부터 다녀오겠습니다!" (일단 밖으로)', label: '행동형', scores: { risk: 1, social: 2, logic: 0, resilience: 1 } },
        { id: 'C', text: '"지역 시세 분석 데이터부터 뽑아보겠습니다." (지도와 엑셀 분석)', label: '분석형', scores: { risk: 0, social: -1, logic: 3, resilience: 0 } },
      ],
    },
    {
      id: 'env_2',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '이상적인 근무 환경은 어떤 모습인가요?',
      options: [
        { id: 'A', text: '조용한 사무실에서 혼자 집중하며 일하고 싶다', label: '독립형', scores: { risk: 0, social: -2, logic: 2, resilience: 1 } },
        { id: 'B', text: '팀원들과 소통하며 협업하는 환경이 좋다', label: '협업형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'C', text: '사무실보다 현장에서 뛰어다니는 게 좋다', label: '현장형', scores: { risk: 1, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'env_3',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '업무 중 가장 많은 시간을 보내고 싶은 곳은?',
      options: [
        { id: 'A', text: '사무실 책상 앞 (전화, 서류, 분석)', label: '내근형', scores: { risk: -1, social: 0, logic: 2, resilience: 0 } },
        { id: 'B', text: '현장 (물건 답사, 고객 미팅)', label: '외근형', scores: { risk: 1, social: 2, logic: 0, resilience: 1 } },
        { id: 'C', text: '카페나 공유오피스 (자유로운 환경)', label: '노마드형', scores: { risk: 1, social: 1, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'env_4',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '출퇴근 시간에 대한 생각은?',
      options: [
        { id: 'A', text: '정해진 시간에 출퇴근하는 게 편하다', label: '규칙형', scores: { risk: -1, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '업무량에 따라 유연하게 조절하고 싶다', label: '유연형', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '시간 관계없이 성과만 내면 되는 게 좋다', label: '성과형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'env_5',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '일하면서 가장 스트레스 받는 상황은?',
      options: [
        { id: 'A', text: '계획대로 안 될 때 (예상치 못한 변수)', label: '계획형', scores: { risk: -1, social: 0, logic: 2, resilience: -1 } },
        { id: 'B', text: '혼자 일해야 할 때 (소통 부재)', label: '소통형', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
        { id: 'C', text: '반복적인 일을 해야 할 때 (지루함)', label: '변화추구', scores: { risk: 1, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'env_6',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '주말에 급한 고객 연락이 왔습니다.',
      options: [
        { id: 'A', text: '주말은 개인 시간! 월요일에 연락드린다고 문자만', label: '워라밸', scores: { risk: -1, social: -1, logic: 1, resilience: 1 } },
        { id: 'B', text: '급한 건지 확인하고 상황에 따라 대응한다', label: '상황판단', scores: { risk: 0, social: 1, logic: 1, resilience: 1 } },
        { id: 'C', text: '돈 될 것 같으면 바로 뛰어간다', label: '기회추구', scores: { risk: 2, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'env_7',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '업무용 도구로 가장 자주 쓰는 것은?',
      options: [
        { id: 'A', text: '엑셀, 한글 등 문서 프로그램', label: '문서형', scores: { risk: -1, social: -1, logic: 3, resilience: 0 } },
        { id: 'B', text: '카카오톡, 전화 등 커뮤니케이션 도구', label: '소통형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'C', text: '네이버 부동산, 호갱노노 등 정보 플랫폼', label: '정보형', scores: { risk: 1, social: 0, logic: 2, resilience: 1 } },
      ],
    },
    {
      id: 'env_8',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '회사에서 야근을 요청합니다. 당신의 반응은?',
      options: [
        { id: 'A', text: '할 일이 있으면 해야지, 묵묵히 한다', label: '성실형', scores: { risk: -1, social: 0, logic: 1, resilience: 1 } },
        { id: 'B', text: '이유를 묻고 합리적이면 수용한다', label: '합리형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '내 계약 성사 건이면 밤새도 OK', label: '성과형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'env_9',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '사무실 분위기가 어떨 때 가장 일이 잘 되나요?',
      options: [
        { id: 'A', text: '조용하고 집중할 수 있을 때', label: '집중형', scores: { risk: 0, social: -2, logic: 2, resilience: 0 } },
        { id: 'B', text: '적당히 시끌벅적하고 활기찰 때', label: '활력형', scores: { risk: 0, social: 2, logic: 0, resilience: 1 } },
        { id: 'C', text: '경쟁적인 분위기에서 자극받을 때', label: '경쟁형', scores: { risk: 2, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'env_10',
      category: '업무 환경',
      categoryKey: 'environment',
      question: '재택근무에 대한 생각은?',
      options: [
        { id: 'A', text: '출근해서 일하는 게 더 효율적이다', label: '출근형', scores: { risk: -1, social: 1, logic: 1, resilience: 0 } },
        { id: 'B', text: '상황에 따라 유연하게 선택하고 싶다', label: '하이브리드', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '재택이 최고! 내 페이스대로 일하고 싶다', label: '재택형', scores: { risk: 1, social: -1, logic: 0, resilience: 2 } },
      ],
    },
  ],

  // ========== 3. 설득 스타일 (10개) ==========
  persuasion: [
    {
      id: 'per_1',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '손님이 "이 집은 좀 비싼 것 같은데..."라며 망설입니다.',
      options: [
        { id: 'A', text: '"고객님, 여기 채광이랑 뷰 보세요. 아침에 커피 한 잔 딱! 이 느낌 아시죠?"', label: '감성 호소', scores: { risk: 0, social: 2, logic: -1, resilience: 1 } },
        { id: 'B', text: '"현재 주변 시세 대비 평당 50만 원 저렴하게 나왔습니다. 데이터 보여드릴게요."', label: '팩트 호소', scores: { risk: 0, social: 0, logic: 3, resilience: 0 } },
        { id: 'C', text: '"지금 안 하시면 내일 바로 계약금 들어올 물건입니다. 놓치면 후회하세요."', label: '심리 압박', scores: { risk: 2, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'per_2',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '고객이 경쟁사 매물과 비교하며 흔들립니다.',
      options: [
        { id: 'A', text: '우리 매물의 장점을 감성적으로 어필한다', label: '장점부각', scores: { risk: 0, social: 2, logic: 0, resilience: 1 } },
        { id: 'B', text: '두 매물의 객관적 비교표를 만들어 보여준다', label: '비교분석', scores: { risk: 0, social: 0, logic: 3, resilience: 0 } },
        { id: 'C', text: '경쟁사 매물의 숨겨진 단점을 알려준다', label: '약점공략', scores: { risk: 2, social: 0, logic: 1, resilience: 1 } },
      ],
    },
    {
      id: 'per_3',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '가격 협상 중 고객이 강하게 밀어붙입니다.',
      options: [
        { id: 'A', text: '고객 입장을 공감하며 부드럽게 설득한다', label: '공감형', scores: { risk: -1, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '시세와 원가 근거를 논리적으로 제시한다', label: '논리형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
        { id: 'C', text: '못 해줄 것 같으면 과감히 거절한다', label: '강경형', scores: { risk: 2, social: -1, logic: 1, resilience: 3 } },
      ],
    },
    {
      id: 'per_4',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '처음 만난 고객과 신뢰를 쌓는 방법은?',
      options: [
        { id: 'A', text: '편안한 분위기에서 개인적인 이야기도 나눈다', label: '친밀형', scores: { risk: 0, social: 3, logic: -1, resilience: 1 } },
        { id: 'B', text: '전문성을 보여주는 자료와 정보를 제공한다', label: '전문형', scores: { risk: 0, social: 0, logic: 3, resilience: 0 } },
        { id: 'C', text: '빠르게 좋은 매물을 보여주며 실력으로 증명', label: '실력형', scores: { risk: 1, social: 1, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'per_5',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '프레젠테이션 스타일은?',
      options: [
        { id: 'A', text: '스토리텔링으로 감성을 자극한다', label: '스토리형', scores: { risk: 0, social: 2, logic: 0, resilience: 1 } },
        { id: 'B', text: '데이터와 그래프로 논리적으로 설명한다', label: '데이터형', scores: { risk: 0, social: -1, logic: 3, resilience: 0 } },
        { id: 'C', text: '핵심만 짧게, 결론부터 말한다', label: '핵심형', scores: { risk: 1, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'per_6',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '고객이 결정을 미루려 합니다. 어떻게 하시겠어요?',
      options: [
        { id: 'A', text: '충분히 생각할 시간을 드리고 기다린다', label: '인내형', scores: { risk: -1, social: 2, logic: 0, resilience: 0 } },
        { id: 'B', text: '결정에 필요한 추가 정보를 정리해서 보내드린다', label: '지원형', scores: { risk: 0, social: 1, logic: 2, resilience: 1 } },
        { id: 'C', text: '마감 시한을 활용해 결정을 유도한다', label: '촉진형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'per_7',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '계약 직전 고객이 갑자기 불안해합니다.',
      options: [
        { id: 'A', text: '차 한 잔 하면서 걱정을 들어준다', label: '경청형', scores: { risk: -1, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '계약서 조항을 하나씩 설명하며 안심시킨다', label: '설명형', scores: { risk: 0, social: 1, logic: 2, resilience: 1 } },
        { id: 'C', text: '"여기서 물러나면 다시 못 잡습니다" 확신을 준다', label: '확신형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'per_8',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '고객의 무리한 요구에 대한 대응은?',
      options: [
        { id: 'A', text: '최대한 맞춰드리려고 노력한다', label: '수용형', scores: { risk: 0, social: 2, logic: -1, resilience: -1 } },
        { id: 'B', text: '가능한 범위를 설명하고 대안을 제시한다', label: '협상형', scores: { risk: 0, social: 1, logic: 2, resilience: 1 } },
        { id: 'C', text: '불가능한 건 단호하게 말씀드린다', label: '원칙형', scores: { risk: 1, social: -1, logic: 1, resilience: 3 } },
      ],
    },
    {
      id: 'per_9',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '초보 고객에게 복잡한 내용을 설명할 때?',
      options: [
        { id: 'A', text: '비유와 예시를 들어 쉽게 풀어서 설명한다', label: '친절형', scores: { risk: 0, social: 2, logic: 1, resilience: 1 } },
        { id: 'B', text: '도표와 자료를 활용해 체계적으로 설명한다', label: '체계형', scores: { risk: 0, social: 0, logic: 3, resilience: 0 } },
        { id: 'C', text: '"제가 알아서 할게요, 믿으세요"라고 한다', label: '신뢰형', scores: { risk: 2, social: 1, logic: -1, resilience: 2 } },
      ],
    },
    {
      id: 'per_10',
      category: '설득 스타일',
      categoryKey: 'persuasion',
      question: '영업할 때 가장 중요하게 생각하는 것은?',
      options: [
        { id: 'A', text: '고객과의 관계 - 장기적 신뢰가 중요', label: '관계중시', scores: { risk: -1, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '정보력 - 정확한 데이터가 경쟁력', label: '정보중시', scores: { risk: 0, social: 0, logic: 3, resilience: 0 } },
        { id: 'C', text: '클로징 - 결국 계약이 성사되어야', label: '결과중시', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
  ],

  // ========== 4. 회복탄력성 (10개) ==========
  resilience: [
    {
      id: 'res_1',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '열심히 브리핑했는데 고객이 "됐어요, 다른 부동산 갈게요" 하고 쌀쌀맞게 나갔습니다.',
      options: [
        { id: 'A', text: "'내가 뭘 잘못했나...' 계속 곱씹으며 소주 한 잔 한다.", label: '섬세함', scores: { risk: -1, social: 1, logic: 1, resilience: -2 } },
        { id: 'B', text: "'인연이 아닌가 보다~' 하고 넷플릭스 보며 잊는다.", label: '쿨함', scores: { risk: 0, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: "'두고 봐라, 더 좋은 물건 찾아서 다시 연락한다.'", label: '오기/승부욕', scores: { risk: 2, social: 1, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_2',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '3개월째 계약이 없습니다. 기분이 어떤가요?',
      options: [
        { id: 'A', text: '많이 지치고 불안하다. 이 일이 맞나 싶다', label: '불안형', scores: { risk: -1, social: 0, logic: 0, resilience: -3 } },
        { id: 'B', text: '힘들지만 언젠간 터지겠지 하며 버틴다', label: '인내형', scores: { risk: 0, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '오히려 더 자극받아서 열심히 뛴다', label: '투지형', scores: { risk: 1, social: 0, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_3',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '계약 직전에 고객이 변심해서 깨졌습니다.',
      options: [
        { id: 'A', text: '한동안 멘탈이 나가서 일이 손에 안 잡힌다', label: '충격형', scores: { risk: -1, social: 0, logic: 0, resilience: -3 } },
        { id: 'B', text: '아쉽지만 다음 기회를 위해 정리한다', label: '수용형', scores: { risk: 0, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '바로 다음 고객에게 집중한다. 과거는 과거', label: '전환형', scores: { risk: 1, social: 0, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_4',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '동료가 나보다 훨씬 좋은 실적을 냈습니다.',
      options: [
        { id: 'A', text: '솔직히 부럽고 약간 자괴감이 든다', label: '비교형', scores: { risk: -1, social: 0, logic: 0, resilience: -2 } },
        { id: 'B', text: '축하해주고 노하우를 배우려고 한다', label: '학습형', scores: { risk: 0, social: 2, logic: 1, resilience: 2 } },
        { id: 'C', text: '나도 할 수 있다! 승부욕이 불탄다', label: '경쟁형', scores: { risk: 1, social: 0, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_5',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '고객에게 심한 컴플레인을 받았습니다.',
      options: [
        { id: 'A', text: '상처받아서 한동안 고객 응대가 두렵다', label: '민감형', scores: { risk: -1, social: 0, logic: 0, resilience: -3 } },
        { id: 'B', text: '문제를 분석하고 재발 방지를 고민한다', label: '개선형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '털어버리고 다음 고객에게 집중한다', label: '리셋형', scores: { risk: 1, social: 0, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_6',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '스트레스 해소법은?',
      options: [
        { id: 'A', text: '친구나 가족과 대화하며 푼다', label: '소통형', scores: { risk: 0, social: 2, logic: 0, resilience: 1 } },
        { id: 'B', text: '운동이나 취미로 몸을 움직인다', label: '활동형', scores: { risk: 0, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '일에 더 몰두해서 잊는다', label: '몰입형', scores: { risk: 1, social: -1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'res_7',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '실패했을 때 가장 먼저 드는 생각은?',
      options: [
        { id: 'A', text: '"왜 나만 이럴까..." 자책이 먼저 든다', label: '자책형', scores: { risk: -1, social: 0, logic: 0, resilience: -3 } },
        { id: 'B', text: '"뭐가 문제였지?" 원인을 분석한다', label: '분석형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '"다음엔 무조건 성공한다" 바로 다음을 본다', label: '전진형', scores: { risk: 1, social: 0, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_8',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '힘든 시기를 버티게 해주는 것은?',
      options: [
        { id: 'A', text: '주변 사람들의 응원과 지지', label: '관계형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '미래에 대한 목표와 계획', label: '목표형', scores: { risk: 0, social: 0, logic: 2, resilience: 2 } },
        { id: 'C', text: '내 안의 오기와 자존심', label: '자존형', scores: { risk: 1, social: -1, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_9',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '거절당했을 때 복구되는 시간은?',
      options: [
        { id: 'A', text: '며칠은 마음이 좀 안 좋다', label: '느림형', scores: { risk: -1, social: 0, logic: 0, resilience: -2 } },
        { id: 'B', text: '하루 정도면 괜찮아진다', label: '보통형', scores: { risk: 0, social: 0, logic: 0, resilience: 1 } },
        { id: 'C', text: '5분이면 충분. 바로 다음 행동', label: '빠름형', scores: { risk: 1, social: 0, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'res_10',
      category: '회복탄력성',
      categoryKey: 'resilience',
      question: '이 업계에서 오래 버틸 수 있다고 생각하나요?',
      options: [
        { id: 'A', text: '솔직히 자신 없다. 적응 중이다', label: '적응중', scores: { risk: -1, social: 0, logic: 0, resilience: -1 } },
        { id: 'B', text: '힘들지만 할 만하다고 느낀다', label: '적응형', scores: { risk: 0, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '나는 이 바닥 체질이다!', label: '확신형', scores: { risk: 1, social: 1, logic: 0, resilience: 3 } },
      ],
    },
  ],

  // ========== 5. 돈에 대한 가치관 (10개) ==========
  money: [
    {
      id: 'mon_1',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '첫 계약 성공! 수수료로 1,000만 원이 일시불로 입금되었습니다.',
      options: [
        { id: 'A', text: '고생한 나를 위한 명품 가방/시계 FLEX!', label: '현재의 보상', scores: { risk: 1, social: 2, logic: -1, resilience: 1 } },
        { id: 'B', text: '바로 주식이나 코인, 청약 통장에 넣는다.', label: '미래의 증식', scores: { risk: 2, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '부모님 용돈 드리고 안전하게 적금에 넣는다.', label: '안정 추구', scores: { risk: -2, social: 1, logic: 1, resilience: 0 } },
      ],
    },
    {
      id: 'mon_2',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '돈을 버는 가장 큰 이유는?',
      options: [
        { id: 'A', text: '당장의 생활과 안정을 위해', label: '안정형', scores: { risk: -2, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '하고 싶은 것을 하기 위한 자유', label: '자유형', scores: { risk: 1, social: 1, logic: 0, resilience: 2 } },
        { id: 'C', text: '더 큰 부를 축적하기 위해', label: '성장형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'mon_3',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '목표 연봉은?',
      options: [
        { id: 'A', text: '4-5천만 원 정도면 충분하다', label: '적정형', scores: { risk: -2, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '1억은 벌어야 성공이라고 느낀다', label: '목표형', scores: { risk: 1, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '상한선은 없다. 많을수록 좋다', label: '무제한', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'mon_4',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '급여와 복지 중 더 중요한 것은?',
      options: [
        { id: 'A', text: '복지 - 워라밸과 안정성이 중요', label: '복지형', scores: { risk: -2, social: 1, logic: 0, resilience: 0 } },
        { id: 'B', text: '균형 - 둘 다 적당해야 한다', label: '균형형', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '급여 - 돈이 최고다', label: '급여형', scores: { risk: 2, social: -1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'mon_5',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '여유자금 1억이 생기면?',
      options: [
        { id: 'A', text: '은행 예금이나 안전한 채권에 넣는다', label: '안전형', scores: { risk: -3, social: 0, logic: 2, resilience: 0 } },
        { id: 'B', text: '분산 투자 - 부동산, 주식, 예금 등', label: '분산형', scores: { risk: 1, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '레버리지 일으켜서 부동산 투자', label: '레버리지', scores: { risk: 3, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'mon_6',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '수수료 협상 시 당신의 스타일은?',
      options: [
        { id: 'A', text: '고객이 원하면 깎아주는 편이다', label: '유연형', scores: { risk: -1, social: 2, logic: 0, resilience: 0 } },
        { id: 'B', text: '정해진 요율을 지키려고 노력한다', label: '원칙형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '내 가치만큼 받아야 한다. 양보 안 함', label: '고수익', scores: { risk: 2, social: -1, logic: 0, resilience: 3 } },
      ],
    },
    {
      id: 'mon_7',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '부자가 되는 방법은?',
      options: [
        { id: 'A', text: '아끼고 모으는 것이 기본', label: '저축형', scores: { risk: -2, social: 0, logic: 2, resilience: 0 } },
        { id: 'B', text: '좋은 투자를 해야 한다', label: '투자형', scores: { risk: 2, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '수입 자체를 늘려야 한다', label: '수입형', scores: { risk: 1, social: 1, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'mon_8',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '돈보다 중요한 것이 있다고 생각하나요?',
      options: [
        { id: 'A', text: '당연하지. 가족, 건강, 행복이 먼저', label: '균형형', scores: { risk: -1, social: 2, logic: 0, resilience: 1 } },
        { id: 'B', text: '어느 정도 돈이 있어야 그것도 가능', label: '현실형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '돈이면 다 된다. 일단 벌자', label: '물질형', scores: { risk: 2, social: -1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'mon_9',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '월급이 밀렸을 때 반응은?',
      options: [
        { id: 'A', text: '당장 생활이 걱정되어 불안하다', label: '불안형', scores: { risk: -2, social: 0, logic: 0, resilience: -1 } },
        { id: 'B', text: '비상금이 있으니 일단 기다려본다', label: '준비형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '다른 수입원이 있어서 괜찮다', label: '다각화', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'mon_10',
      category: '돈에 대한 가치관',
      categoryKey: 'money',
      question: '경제적 자유(파이어족)에 대한 생각은?',
      options: [
        { id: 'A', text: '꿈 같은 이야기. 현실적으로 어렵다', label: '현실형', scores: { risk: -2, social: 0, logic: 1, resilience: -1 } },
        { id: 'B', text: '목표로 삼고 계획적으로 준비 중', label: '목표형', scores: { risk: 1, social: 0, logic: 2, resilience: 2 } },
        { id: 'C', text: '반드시 달성하고 말 것이다!', label: '확신형', scores: { risk: 2, social: 0, logic: 1, resilience: 3 } },
      ],
    },
  ],

  // ========== 6. 정보 습득 방식 (10개) ==========
  learning: [
    {
      id: 'lea_1',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '모르는 부동산 용어나 법률이 나왔습니다.',
      options: [
        { id: 'A', text: '바로 옆자리 사수나 잘 아는 선배에게 물어본다.', label: '대인 관계형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '유튜브나 블로그 검색해서 내가 직접 알아낸다.', label: '독학형', scores: { risk: 1, social: -1, logic: 2, resilience: 2 } },
        { id: 'C', text: '관련 서적을 찾아보거나 유료 강의를 끊는다.', label: '학구파형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
      ],
    },
    {
      id: 'lea_2',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '새로운 지역 시장을 분석할 때?',
      options: [
        { id: 'A', text: '그 지역 선배나 동료에게 물어본다', label: '네트워크', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '직접 발품 팔며 현장을 돌아다닌다', label: '현장형', scores: { risk: 1, social: 1, logic: 1, resilience: 2 } },
        { id: 'C', text: '데이터와 통계 자료를 분석한다', label: '데이터형', scores: { risk: 0, social: -1, logic: 3, resilience: 0 } },
      ],
    },
    {
      id: 'lea_3',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '업계 트렌드는 주로 어디서 파악하나요?',
      options: [
        { id: 'A', text: '선후배 모임, 협회 행사에서', label: '인맥형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '부동산 뉴스, 유튜브, SNS에서', label: '미디어형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '정부 발표, 통계청 자료에서', label: '공식채널', scores: { risk: 0, social: -1, logic: 3, resilience: 0 } },
      ],
    },
    {
      id: 'lea_4',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '학습할 때 선호하는 방식은?',
      options: [
        { id: 'A', text: '스터디 그룹이나 멘토링', label: '그룹학습', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '혼자 책이나 영상 보기', label: '개인학습', scores: { risk: 0, social: -1, logic: 2, resilience: 1 } },
        { id: 'C', text: '실전에서 부딪히며 배우기', label: '실전학습', scores: { risk: 2, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'lea_5',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '자격증 공부는 어떻게 하시나요?',
      options: [
        { id: 'A', text: '학원이나 스터디 그룹에서', label: '학원형', scores: { risk: 0, social: 2, logic: 1, resilience: 0 } },
        { id: 'B', text: '인터넷 강의로 혼자', label: '인강형', scores: { risk: 0, social: -1, logic: 2, resilience: 1 } },
        { id: 'C', text: '기출 문제만 반복', label: '기출형', scores: { risk: 1, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'lea_6',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '업무 중 막히는 부분이 있으면?',
      options: [
        { id: 'A', text: '바로 동료나 선배에게 SOS', label: '협력형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '일단 혼자 해결해보려고 노력', label: '자립형', scores: { risk: 0, social: -1, logic: 2, resilience: 2 } },
        { id: 'C', text: '구글링으로 비슷한 사례 검색', label: '검색형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
      ],
    },
    {
      id: 'lea_7',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '새로운 IT 도구(앱, 프로그램)가 나오면?',
      options: [
        { id: 'A', text: '남들이 쓰는 걸 보고 따라한다', label: '관망형', scores: { risk: -1, social: 1, logic: 0, resilience: 0 } },
        { id: 'B', text: '튜토리얼 보고 차근차근 익힌다', label: '학습형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '일단 설치해서 이것저것 눌러본다', label: '탐험형', scores: { risk: 1, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'lea_8',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '유료 교육/컨설팅에 대한 생각은?',
      options: [
        { id: 'A', text: '돈 들이면 아깝다. 무료로 충분', label: '무료선호', scores: { risk: -1, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '가성비 좋으면 투자한다', label: '선택적', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '자기 투자는 아끼면 안 된다', label: '투자형', scores: { risk: 1, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'lea_9',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '정보의 신뢰성은 어떻게 확인하나요?',
      options: [
        { id: 'A', text: '믿을 만한 사람의 말을 신뢰', label: '관계신뢰', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
        { id: 'B', text: '여러 소스를 교차 확인', label: '교차검증', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
        { id: 'C', text: '공식 기관 자료만 본다', label: '공식채널', scores: { risk: -1, social: 0, logic: 2, resilience: 0 } },
      ],
    },
    {
      id: 'lea_10',
      category: '정보 습득 방식',
      categoryKey: 'learning',
      question: '책 vs 영상 vs 현장, 선호하는 학습 채널은?',
      options: [
        { id: 'A', text: '책 - 체계적으로 공부하는 게 좋다', label: '책형', scores: { risk: 0, social: -1, logic: 3, resilience: 0 } },
        { id: 'B', text: '영상 - 보고 듣는 게 편하다', label: '영상형', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '현장 - 직접 경험이 최고다', label: '현장형', scores: { risk: 1, social: 1, logic: 0, resilience: 2 } },
      ],
    },
  ],

  // ========== 7. 네트워킹 스타일 (10개) ==========
  networking: [
    {
      id: 'net_1',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '지역 부동산 모임 회식이 잡혔습니다. 당신의 포지션은?',
      options: [
        { id: 'A', text: '분위기 메이커! 노래방 마이크는 내 것.', label: '핵인싸 영업왕', scores: { risk: 2, social: 3, logic: -1, resilience: 2 } },
        { id: 'B', text: '조용히 고기 굽으며 실세 소장님들과 명함 교환.', label: '전략적 네트워킹', scores: { risk: 1, social: 2, logic: 2, resilience: 1 } },
        { id: 'C', text: '"저는 먼저 들어가 보겠습니다."', label: '칼퇴 후 내 시간 중요', scores: { risk: -1, social: -2, logic: 1, resilience: 1 } },
      ],
    },
    {
      id: 'net_2',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '처음 보는 사람과 대화할 때?',
      options: [
        { id: 'A', text: '먼저 말 걸고 친해지려고 노력', label: '적극형', scores: { risk: 1, social: 3, logic: 0, resilience: 2 } },
        { id: 'B', text: '상대가 먼저 말 걸면 잘 대응', label: '반응형', scores: { risk: 0, social: 1, logic: 0, resilience: 1 } },
        { id: 'C', text: '어색해서 혼자 있는 편', label: '내성형', scores: { risk: -1, social: -2, logic: 1, resilience: 0 } },
      ],
    },
    {
      id: 'net_3',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '인맥 관리는 어떻게 하시나요?',
      options: [
        { id: 'A', text: '자주 연락하고 만나려고 노력', label: '적극관리', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '필요할 때 연락하는 편', label: '필요시', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '연락하는 게 좀 부담스럽다', label: '소극적', scores: { risk: -1, social: -2, logic: 0, resilience: 0 } },
      ],
    },
    {
      id: 'net_4',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: 'SNS(인스타, 페북 등) 활용은?',
      options: [
        { id: 'A', text: '적극 활용 - 업무에도 도움이 된다', label: 'SNS적극', scores: { risk: 1, social: 2, logic: 0, resilience: 1 } },
        { id: 'B', text: '보는 정도 - 올리진 않는다', label: '관망형', scores: { risk: 0, social: 0, logic: 0, resilience: 0 } },
        { id: 'C', text: '안 한다 - 시간 낭비라고 생각', label: 'SNS기피', scores: { risk: 0, social: -1, logic: 1, resilience: 1 } },
      ],
    },
    {
      id: 'net_5',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '명함을 받으면?',
      options: [
        { id: 'A', text: '바로 연락처 저장하고 인사 문자', label: '즉시연락', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '필요할 때 찾아보려고 모아둔다', label: '보관형', scores: { risk: 0, social: 0, logic: 1, resilience: 0 } },
        { id: 'C', text: '어디 뒀는지 잘 모르겠다', label: '무관심', scores: { risk: 0, social: -2, logic: -1, resilience: 0 } },
      ],
    },
    {
      id: 'net_6',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '협력 중개(공동 중개)에 대한 생각은?',
      options: [
        { id: 'A', text: '네트워크 확장에 좋다. 자주 한다', label: '협력적', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '상황에 따라 선택적으로', label: '선택적', scores: { risk: 0, social: 1, logic: 1, resilience: 1 } },
        { id: 'C', text: '혼자 하는 게 편하다', label: '독립적', scores: { risk: 0, social: -2, logic: 1, resilience: 1 } },
      ],
    },
    {
      id: 'net_7',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '업계 선배에게 조언을 구할 때?',
      options: [
        { id: 'A', text: '자주 연락드리고 만남도 갖는다', label: '멘토형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '정말 필요할 때만 연락드린다', label: '필요시', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '부담스러워서 잘 안 한다', label: '독립형', scores: { risk: 0, social: -2, logic: 0, resilience: 0 } },
      ],
    },
    {
      id: 'net_8',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '점심시간에는 보통?',
      options: [
        { id: 'A', text: '동료들과 함께 식사', label: '그룹형', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
        { id: 'B', text: '고객이나 거래처와 미팅', label: '비즈니스', scores: { risk: 1, social: 2, logic: 1, resilience: 1 } },
        { id: 'C', text: '혼밥하면서 재충전', label: '개인형', scores: { risk: 0, social: -1, logic: 0, resilience: 1 } },
      ],
    },
    {
      id: 'net_9',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '갈등 상황에서 당신은?',
      options: [
        { id: 'A', text: '대화로 풀어나가려고 노력', label: '소통형', scores: { risk: 0, social: 2, logic: 1, resilience: 1 } },
        { id: 'B', text: '일단 거리를 두고 시간을 갖는다', label: '회피형', scores: { risk: -1, social: -1, logic: 1, resilience: 0 } },
        { id: 'C', text: '할 말은 하고 본다', label: '직면형', scores: { risk: 1, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'net_10',
      category: '네트워킹 스타일',
      categoryKey: 'networking',
      question: '이상적인 팀 환경은?',
      options: [
        { id: 'A', text: '화기애애하고 친밀한 분위기', label: '친밀형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '서로 존중하며 각자 일하는 분위기', label: '독립형', scores: { risk: 0, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '선의의 경쟁이 있는 분위기', label: '경쟁형', scores: { risk: 1, social: 1, logic: 0, resilience: 2 } },
      ],
    },
  ],

  // ========== 8. 성취 동기 (10개) ==========
  motivation: [
    {
      id: 'mot_1',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '당신이 일하면서 가장 짜릿함을 느끼는 순간은?',
      options: [
        { id: 'A', text: '"역시 김 실장님 최고야!" 고객과 동료들에게 인정받을 때', label: '명예형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '통장에 찍힌 수수료 금액 0의 개수를 볼 때', label: '실리형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '복잡한 권리 관계를 깔끔하게 해결했을 때', label: '문제해결형', scores: { risk: 0, social: 0, logic: 3, resilience: 2 } },
      ],
    },
    {
      id: 'mot_2',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '이 일을 하는 가장 큰 이유는?',
      options: [
        { id: 'A', text: '사람들과 만나고 소통하는 게 좋아서', label: '관계형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '노력한 만큼 버는 구조가 좋아서', label: '보상형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '전문성을 키우고 성장할 수 있어서', label: '성장형', scores: { risk: 0, social: 0, logic: 2, resilience: 2 } },
      ],
    },
    {
      id: 'mot_3',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '롤모델이 있다면 어떤 사람인가요?',
      options: [
        { id: 'A', text: '모두에게 존경받는 업계 원로', label: '명예형', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
        { id: 'B', text: '실적으로 증명한 탑 세일즈맨', label: '실적형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '자기 분야 전문가로 인정받는 사람', label: '전문형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
      ],
    },
    {
      id: 'mot_4',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '업무 성과를 어떻게 측정하나요?',
      options: [
        { id: 'A', text: '고객 만족도와 재계약률', label: '서비스형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '매출액과 수익', label: '수익형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '거래 건수와 성장률', label: '성장형', scores: { risk: 1, social: 0, logic: 2, resilience: 1 } },
      ],
    },
    {
      id: 'mot_5',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '칭찬받고 싶은 말은?',
      options: [
        { id: 'A', text: '"정말 친절하시네요"', label: '친절형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '"진짜 일 잘하시네요"', label: '능력형', scores: { risk: 1, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '"전문가시네요, 믿음이 가요"', label: '전문형', scores: { risk: 0, social: 1, logic: 2, resilience: 1 } },
      ],
    },
    {
      id: 'mot_6',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '승진/성장의 기준은?',
      options: [
        { id: 'A', text: '조직 내 신뢰와 평판', label: '평판형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '실적과 숫자로 증명', label: '실적형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
        { id: 'C', text: '전문 지식과 능력 향상', label: '역량형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
      ],
    },
    {
      id: 'mot_7',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '1년 후 나에게 바라는 것은?',
      options: [
        { id: 'A', text: '좋은 사람들과 함께 일하고 있는 것', label: '관계형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '수입이 2배 이상 늘어난 것', label: '수입형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '전문가로 인정받는 것', label: '전문형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
      ],
    },
    {
      id: 'mot_8',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '퇴근 후 가장 뿌듯한 하루는?',
      options: [
        { id: 'A', text: '고객에게 감사 인사를 받은 날', label: '보람형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'B', text: '큰 계약이 성사된 날', label: '성과형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '어려운 문제를 해결한 날', label: '해결형', scores: { risk: 0, social: 0, logic: 3, resilience: 2 } },
      ],
    },
    {
      id: 'mot_9',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '동기부여가 되는 것은?',
      options: [
        { id: 'A', text: '동료들의 응원과 인정', label: '사회적', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '성과에 따른 보상', label: '물질적', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '새로운 것을 배우는 즐거움', label: '성장적', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
      ],
    },
    {
      id: 'mot_10',
      category: '성취 동기',
      categoryKey: 'motivation',
      question: '은퇴 후 남기고 싶은 것은?',
      options: [
        { id: 'A', text: '좋은 사람이었다는 평판', label: '명예형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '충분한 재산', label: '재산형', scores: { risk: 2, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '업계에 기여한 전문 지식', label: '유산형', scores: { risk: 0, social: 1, logic: 2, resilience: 1 } },
      ],
    },
  ],

  // ========== 9. 미래 목표 (10개) ==========
  future: [
    {
      id: 'fut_1',
      category: '미래 목표',
      categoryKey: 'future',
      question: '10년 뒤, 당신의 명함에 박혀있을 직함은?',
      options: [
        { id: 'A', text: 'OO 부동산 대표 공인중개사 (내 가게 운영)', label: '창업형', scores: { risk: 2, social: 2, logic: 1, resilience: 2 } },
        { id: 'B', text: '부동산 투자 자문위원 / 경매 컨설턴트 (전문 지식인)', label: '전문가형', scores: { risk: 1, social: 1, logic: 3, resilience: 1 } },
        { id: 'C', text: '빌딩 3채 건물주 (파이어족)', label: '투자형', scores: { risk: 3, social: 0, logic: 2, resilience: 2 } },
      ],
    },
    {
      id: 'fut_2',
      category: '미래 목표',
      categoryKey: 'future',
      question: '5년 후 목표 연봉은?',
      options: [
        { id: 'A', text: '지금의 1.5배 정도면 만족', label: '현실형', scores: { risk: -1, social: 0, logic: 1, resilience: 0 } },
        { id: 'B', text: '지금의 3배는 되어야', label: '도전형', scores: { risk: 1, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '억대 연봉이 목표', label: '야망형', scores: { risk: 3, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'fut_3',
      category: '미래 목표',
      categoryKey: 'future',
      question: '커리어의 최종 목표는?',
      options: [
        { id: 'A', text: '일과 삶의 균형을 이루며 안정적으로', label: '균형형', scores: { risk: -1, social: 1, logic: 0, resilience: 0 } },
        { id: 'B', text: '분야 전문가로 인정받기', label: '전문형', scores: { risk: 0, social: 1, logic: 3, resilience: 1 } },
        { id: 'C', text: '사업 확장 또는 경제적 자유', label: '성장형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'fut_4',
      category: '미래 목표',
      categoryKey: 'future',
      question: '언젠가 해보고 싶은 것은?',
      options: [
        { id: 'A', text: '후배 양성/멘토링', label: '교육형', scores: { risk: 0, social: 3, logic: 1, resilience: 0 } },
        { id: 'B', text: '부동산 관련 사업 확장', label: '사업형', scores: { risk: 2, social: 1, logic: 1, resilience: 2 } },
        { id: 'C', text: '강의/책 출간/컨설팅', label: '전문형', scores: { risk: 0, social: 1, logic: 3, resilience: 1 } },
      ],
    },
    {
      id: 'fut_5',
      category: '미래 목표',
      categoryKey: 'future',
      question: '은퇴 시기는 언제쯤?',
      options: [
        { id: 'A', text: '60대 초반이면 충분히 일했다', label: '적정형', scores: { risk: -1, social: 0, logic: 0, resilience: 0 } },
        { id: 'B', text: '몸이 허락하는 한 계속', label: '현역형', scores: { risk: 0, social: 0, logic: 0, resilience: 2 } },
        { id: 'C', text: '빨리 경제적 자유 얻고 은퇴!', label: '파이어형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'fut_6',
      category: '미래 목표',
      categoryKey: 'future',
      question: '독립/창업에 대한 생각은?',
      options: [
        { id: 'A', text: '안정적인 조직에 소속되어 있고 싶다', label: '안정형', scores: { risk: -2, social: 1, logic: 0, resilience: 0 } },
        { id: 'B', text: '충분히 준비되면 도전해볼 만하다', label: '준비형', scores: { risk: 1, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '반드시 내 사업을 하고 싶다', label: '창업형', scores: { risk: 3, social: 1, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'fut_7',
      category: '미래 목표',
      categoryKey: 'future',
      question: '성공의 기준은?',
      options: [
        { id: 'A', text: '행복하고 만족스러운 삶', label: '행복형', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
        { id: 'B', text: '사회적 인정과 평판', label: '명예형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
        { id: 'C', text: '경제적 부와 자유', label: '물질형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
      ],
    },
    {
      id: 'fut_8',
      category: '미래 목표',
      categoryKey: 'future',
      question: '부동산 외 다른 분야 진출은?',
      options: [
        { id: 'A', text: '부동산에만 집중할 것', label: '집중형', scores: { risk: 0, social: 0, logic: 2, resilience: 1 } },
        { id: 'B', text: '관련 분야로 확장 가능', label: '확장형', scores: { risk: 1, social: 0, logic: 1, resilience: 1 } },
        { id: 'C', text: '기회가 오면 뭐든 도전', label: '다각화', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'fut_9',
      category: '미래 목표',
      categoryKey: 'future',
      question: '10년 후 어디서 일하고 싶나요?',
      options: [
        { id: 'A', text: '지금 있는 곳에서 더 성장', label: '충성형', scores: { risk: -1, social: 1, logic: 0, resilience: 0 } },
        { id: 'B', text: '더 큰 조직이나 회사에서', label: '이직형', scores: { risk: 1, social: 1, logic: 1, resilience: 1 } },
        { id: 'C', text: '내 이름 건 사무실에서', label: '독립형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
      ],
    },
    {
      id: 'fut_10',
      category: '미래 목표',
      categoryKey: 'future',
      question: '미래를 위해 지금 준비하는 것은?',
      options: [
        { id: 'A', text: '인맥과 신뢰 쌓기', label: '관계형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
        { id: 'B', text: '자격증과 전문성 확보', label: '역량형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
        { id: 'C', text: '자본과 투자 경험 축적', label: '자본형', scores: { risk: 2, social: 0, logic: 1, resilience: 2 } },
      ],
    },
  ],

  // ========== 10. 자기 이미지 (10개) ==========
  selfImage: [
    {
      id: 'img_1',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '다음 중 나를 가장 잘 표현하는 단어는?',
      options: [
        { id: 'A', text: '불도저 (일단 돌격)', label: '추진력', scores: { risk: 3, social: 1, logic: -1, resilience: 3 } },
        { id: 'B', text: '셜록 홈즈 (분석과 추리)', label: '분석력', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
        { id: 'C', text: '마더 테레사 (경청과 공감)', label: '공감력', scores: { risk: -1, social: 3, logic: 0, resilience: 1 } },
        { id: 'D', text: '카멜레온 (상황 적응력)', label: '적응력', scores: { risk: 1, social: 2, logic: 1, resilience: 3 } },
      ],
    },
    {
      id: 'img_2',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '친구들이 나를 뭐라고 부르나요?',
      options: [
        { id: 'A', text: '행동파 / 추진력 있는 친구', label: '행동형', scores: { risk: 2, social: 1, logic: 0, resilience: 2 } },
        { id: 'B', text: '든든한 / 믿음직한 친구', label: '신뢰형', scores: { risk: 0, social: 2, logic: 1, resilience: 1 } },
        { id: 'C', text: '똑똒한 / 분석력 있는 친구', label: '분석형', scores: { risk: 0, social: 0, logic: 3, resilience: 0 } },
      ],
    },
    {
      id: 'img_3',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '내 장점은?',
      options: [
        { id: 'A', text: '적극성과 추진력', label: '추진형', scores: { risk: 2, social: 1, logic: 0, resilience: 2 } },
        { id: 'B', text: '꼼꼼함과 분석력', label: '꼼꼼형', scores: { risk: 0, social: -1, logic: 3, resilience: 0 } },
        { id: 'C', text: '공감능력과 소통력', label: '소통형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
      ],
    },
    {
      id: 'img_4',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '내 단점은?',
      options: [
        { id: 'A', text: '급한 성격 / 참을성 부족', label: '급함', scores: { risk: 2, social: 0, logic: -1, resilience: 1 } },
        { id: 'B', text: '우유부단 / 결정 어려움', label: '우유부단', scores: { risk: -2, social: 1, logic: 0, resilience: -1 } },
        { id: 'C', text: '완벽주의 / 너무 꼼꼼함', label: '완벽주의', scores: { risk: 0, social: -1, logic: 2, resilience: 0 } },
      ],
    },
    {
      id: 'img_5',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '스트레스 상황에서 나는?',
      options: [
        { id: 'A', text: '오히려 집중력이 올라간다', label: '강심장', scores: { risk: 2, social: 0, logic: 0, resilience: 3 } },
        { id: 'B', text: '차분하게 분석하며 대응한다', label: '냉정형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
        { id: 'C', text: '주변에 도움을 요청한다', label: '협력형', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
      ],
    },
    {
      id: 'img_6',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '타인에게 어떻게 보이고 싶나요?',
      options: [
        { id: 'A', text: '성공한 사람', label: '성공형', scores: { risk: 2, social: 0, logic: 0, resilience: 2 } },
        { id: 'B', text: '신뢰할 수 있는 전문가', label: '전문형', scores: { risk: 0, social: 1, logic: 2, resilience: 1 } },
        { id: 'C', text: '따뜻하고 좋은 사람', label: '호감형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
      ],
    },
    {
      id: 'img_7',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '결정을 내릴 때 나는?',
      options: [
        { id: 'A', text: '직감을 믿고 빠르게 결정', label: '직관형', scores: { risk: 2, social: 0, logic: -1, resilience: 2 } },
        { id: 'B', text: '충분히 분석하고 신중하게 결정', label: '분석형', scores: { risk: -1, social: 0, logic: 3, resilience: 0 } },
        { id: 'C', text: '주변 의견을 듣고 결정', label: '협의형', scores: { risk: 0, social: 2, logic: 0, resilience: 0 } },
      ],
    },
    {
      id: 'img_8',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '새로운 환경에서 나는?',
      options: [
        { id: 'A', text: '빨리 적응하고 주도한다', label: '주도형', scores: { risk: 2, social: 2, logic: 0, resilience: 2 } },
        { id: 'B', text: '관찰하며 천천히 적응한다', label: '관찰형', scores: { risk: -1, social: 0, logic: 2, resilience: 1 } },
        { id: 'C', text: '기존 사람들과 친해지려 노력', label: '친화형', scores: { risk: 0, social: 3, logic: 0, resilience: 0 } },
      ],
    },
    {
      id: 'img_9',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '나의 리더십 스타일은?',
      options: [
        { id: 'A', text: '앞에서 끌어가는 스타일', label: '선도형', scores: { risk: 2, social: 2, logic: 0, resilience: 2 } },
        { id: 'B', text: '뒤에서 지원하는 스타일', label: '서포터', scores: { risk: 0, social: 2, logic: 1, resilience: 0 } },
        { id: 'C', text: '전문성으로 인정받는 스타일', label: '전문형', scores: { risk: 0, social: 0, logic: 3, resilience: 1 } },
      ],
    },
    {
      id: 'img_10',
      category: '자기 이미지',
      categoryKey: 'selfImage',
      question: '내 인생 모토는?',
      options: [
        { id: 'A', text: '일단 하고 보자! 도전이 인생이다', label: '도전형', scores: { risk: 3, social: 0, logic: -1, resilience: 3 } },
        { id: 'B', text: '철저한 준비가 성공의 비결', label: '준비형', scores: { risk: -1, social: 0, logic: 3, resilience: 1 } },
        { id: 'C', text: '함께하면 더 멀리 간다', label: '협력형', scores: { risk: 0, social: 3, logic: 0, resilience: 1 } },
      ],
    },
  ],
};

// 카테고리 키 목록
export const CATEGORY_KEYS = [
  'risk',
  'environment',
  'persuasion',
  'resilience',
  'money',
  'learning',
  'networking',
  'motivation',
  'future',
  'selfImage',
] as const;

// 카테고리별 랜덤 1개씩 선택하여 10개 질문 생성
export function generateRandomQuestions(): DNAQuestion[] {
  const questions: DNAQuestion[] = [];

  CATEGORY_KEYS.forEach((key) => {
    const categoryQuestions = QUESTION_POOL[key];
    const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
    questions.push(categoryQuestions[randomIndex]);
  });

  // 질문 순서도 랜덤하게 섞기
  return shuffleArray(questions);
}

// 배열 셔플 (Fisher-Yates 알고리즘)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 전체 질문 수 확인용
export function getTotalQuestionCount(): number {
  return Object.values(QUESTION_POOL).reduce((sum, questions) => sum + questions.length, 0);
}
