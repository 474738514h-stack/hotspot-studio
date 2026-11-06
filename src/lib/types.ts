export type StepId = 1 | 2 | 3 | 4 | 5

export type RiskLevel = "clear" | "caution" | "blocked"

export type NewsSource = "weibo" | "baidu"

export type Trend = "up" | "new"

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: NewsSource
  rank?: number
  heatScore: number
  heatIndex?: number
  reposts?: number
  trend: Trend
  minutesAgo: number
  hashtag: string
  tags: string[]
  preferredTags: string[]
  risk: RiskLevel
  riskNote?: string
}

export interface Product {
  id: string
  name: string
  brand: string
  shop: string
  price: number
  originalPrice: number
  sales: number
  rating: number
  category: string
  tags: string[]
  points: string[]
  scene: string
  shortTag: string
}

export interface MatchResult {
  product: Product
  score: number
  reasons: string[]
  risks: string[]
}

export type Tone = "seed" | "trend" | "urgent" | "interactive"
export type CopyLength = "short" | "medium" | "long"
export type EmojiLevel = "low" | "mid" | "high"
export type EngineId = "local-seed" | "local-news" | "reserved-deepseek" | "reserved-coze"

export interface CopyVariant {
  id: string
  label: string
  tone: Tone
  text: string
  engineLabel: string
}

export interface CopyInput {
  news: NewsItem
  products: Product[]
  reasons: string[]
  tone: Tone
  length: CopyLength
  emoji: EmojiLevel
  includePrice: boolean
  engineId: EngineId
}

export type ReviewState = "idle" | "passed" | "rejected"
export type PublishState = "idle" | "sending" | "sent"

export interface Engagement {
  reposts: number
  comments: number
  likes: number
}
