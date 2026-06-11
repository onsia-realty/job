/**
 * MVP 지역(서울 25구 + 경기 21개 시군구) centroid 상수.
 * region_codes 테이블(migration 019)과 동일 값 — viewport 중심 → 최근접 lawd_cd 매핑용.
 * (brokers-nearby / jobs-nearby API가 lawd_cd를 받으므로 지도 이동 시 자동 갱신)
 */

export interface RegionCentroid {
  lawd_cd: string;
  name: string;
  lat: number;
  lng: number;
}

export const REGION_CENTROIDS: RegionCentroid[] = [
  // 서울 25구
  { lawd_cd: '11110', name: '종로구', lat: 37.5735, lng: 126.9788 },
  { lawd_cd: '11140', name: '중구', lat: 37.5636, lng: 126.9975 },
  { lawd_cd: '11170', name: '용산구', lat: 37.5326, lng: 126.9906 },
  { lawd_cd: '11200', name: '성동구', lat: 37.5634, lng: 127.0368 },
  { lawd_cd: '11215', name: '광진구', lat: 37.5384, lng: 127.0822 },
  { lawd_cd: '11230', name: '동대문구', lat: 37.5744, lng: 127.04 },
  { lawd_cd: '11260', name: '중랑구', lat: 37.6065, lng: 127.0927 },
  { lawd_cd: '11290', name: '성북구', lat: 37.5894, lng: 127.0167 },
  { lawd_cd: '11305', name: '강북구', lat: 37.6396, lng: 127.0256 },
  { lawd_cd: '11320', name: '도봉구', lat: 37.6688, lng: 127.0473 },
  { lawd_cd: '11350', name: '노원구', lat: 37.6541, lng: 127.0565 },
  { lawd_cd: '11380', name: '은평구', lat: 37.6027, lng: 126.9291 },
  { lawd_cd: '11410', name: '서대문구', lat: 37.5791, lng: 126.9368 },
  { lawd_cd: '11440', name: '마포구', lat: 37.5637, lng: 126.9085 },
  { lawd_cd: '11470', name: '양천구', lat: 37.5169, lng: 126.8666 },
  { lawd_cd: '11500', name: '강서구', lat: 37.5509, lng: 126.8495 },
  { lawd_cd: '11530', name: '구로구', lat: 37.4955, lng: 126.8874 },
  { lawd_cd: '11545', name: '금천구', lat: 37.4568, lng: 126.8955 },
  { lawd_cd: '11560', name: '영등포구', lat: 37.5264, lng: 126.8961 },
  { lawd_cd: '11590', name: '동작구', lat: 37.5124, lng: 126.9393 },
  { lawd_cd: '11620', name: '관악구', lat: 37.4784, lng: 126.9516 },
  { lawd_cd: '11650', name: '서초구', lat: 37.4837, lng: 127.0323 },
  { lawd_cd: '11680', name: '강남구', lat: 37.5172, lng: 127.0473 },
  { lawd_cd: '11710', name: '송파구', lat: 37.5145, lng: 127.106 },
  { lawd_cd: '11740', name: '강동구', lat: 37.5301, lng: 127.1237 },
  // 경기 (MVP)
  { lawd_cd: '41111', name: '수원 장안구', lat: 37.304, lng: 127.01 },
  { lawd_cd: '41113', name: '수원 권선구', lat: 37.2578, lng: 127.0186 },
  { lawd_cd: '41115', name: '수원 팔달구', lat: 37.283, lng: 127.0194 },
  { lawd_cd: '41117', name: '수원 영통구', lat: 37.2595, lng: 127.046 },
  { lawd_cd: '41131', name: '성남 수정구', lat: 37.4503, lng: 127.145 },
  { lawd_cd: '41133', name: '성남 중원구', lat: 37.4299, lng: 127.1376 },
  { lawd_cd: '41135', name: '성남 분당구', lat: 37.3822, lng: 127.1186 },
  { lawd_cd: '41171', name: '안양 만안구', lat: 37.3876, lng: 126.9315 },
  { lawd_cd: '41173', name: '안양 동안구', lat: 37.3938, lng: 126.9568 },
  { lawd_cd: '41190', name: '부천시', lat: 37.5034, lng: 126.766 },
  { lawd_cd: '41220', name: '평택시', lat: 36.9921, lng: 127.1127 },
  { lawd_cd: '41271', name: '안산 상록구', lat: 37.31, lng: 126.8469 },
  { lawd_cd: '41273', name: '안산 단원구', lat: 37.3219, lng: 126.8025 },
  { lawd_cd: '41281', name: '고양 덕양구', lat: 37.6369, lng: 126.832 },
  { lawd_cd: '41285', name: '고양 일산동구', lat: 37.6585, lng: 126.7705 },
  { lawd_cd: '41287', name: '고양 일산서구', lat: 37.6739, lng: 126.75 },
  { lawd_cd: '41390', name: '시흥시', lat: 37.38, lng: 126.8033 },
  { lawd_cd: '41461', name: '용인 처인구', lat: 37.2342, lng: 127.2011 },
  { lawd_cd: '41463', name: '용인 기흥구', lat: 37.2751, lng: 127.1145 },
  { lawd_cd: '41465', name: '용인 수지구', lat: 37.322, lng: 127.0976 },
  { lawd_cd: '41590', name: '화성시', lat: 37.1995, lng: 126.8313 },
];

/** 좌표에서 가장 가까운 MVP 지역의 lawd_cd */
export function nearestLawdCd(lat: number, lng: number): string {
  let best = REGION_CENTROIDS[0];
  let minDist = Infinity;
  for (const r of REGION_CENTROIDS) {
    const d = (r.lat - lat) ** 2 + (r.lng - lng) ** 2;
    if (d < minDist) {
      minDist = d;
      best = r;
    }
  }
  return best.lawd_cd;
}
