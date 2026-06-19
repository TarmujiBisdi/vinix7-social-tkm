export type Platform = "Instagram" | "Facebook" | "TikTok" | "YouTube" | "X/Twitter";
export type Sentiment = "positif" | "negatif" | "netral";
export type EngagementLevel = "Rendah" | "Sedang" | "Tinggi";

export interface SocialComment {
  id: string;
  platform: Platform;
  campaign_name: string;
  post_date: string;
  username: string;
  comment_text: string;
  likes: number;
  views: number;
  shares: number;
  sentiment_status: Sentiment | "belum dianalisis";
  confidence_score?: number;
  engagement_level?: EngagementLevel;
  recommendation?: string;
  cleaned_text?: string;
  created_at: string;
}

export interface Settings {
  company_name: string;
  industry: string;
  positive_keywords: string[];
  negative_keywords: string[];
  weights: { likes: number; views: number; shares: number };
  meta_api_token: string;
  ig_account_id: string;
  fb_page_id: string;
  api_connected: boolean;
}

export interface User {
  name: string;
  email: string;
  role: "Admin" | "Stakeholder";
}
