// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  user_type: "agent" | "sales" | "company"; // 공인중개사, 분양상담사, 기업
  created_at: string;
}

// 구인공고
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: PropertyType;
  commission: string;
  deadline: string;
  description: string;
  contact: string;
  tags: string[];
  images: string[];
  video_url?: string;
  views: number;
  is_hot: boolean;
  is_premium: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// 현장 타입
export type PropertyType = "아파트" | "오피스텔" | "지식산업센터" | "상가" | "타운하우스";

// 뉴스/콘텐츠
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "policy" | "law" | "case" | "tip"; // 정책, 법률, 판례, 팁
  thumbnail_url?: string;
  video_script?: string; // AI 생성 영상 스크립트
  views: number;
  created_at: string;
}

// 커뮤니티 게시글
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  user_name: string;
  views: number;
  likes: number;
  comments_count: number;
  created_at: string;
}

// 광고 상품
export interface AdProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "premium" | "video" | "tts" | "brand";
}
