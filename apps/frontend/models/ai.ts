export interface AiSource {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
  fallback: boolean;
  provider?: string;
}
