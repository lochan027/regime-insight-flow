export type RegimeName =
  | "Goldilocks"
  | "Reflation"
  | "Stagflation"
  | "Deflation"
  | "Recovery"
  | "Overheating";

export interface AssetReturn {
  asset: string;
  return_pct: number;
}

export interface CurrentRegimeResponse {
  regime: RegimeName | string;
  in_place_since: string; // ISO date
  months_in_regime: number;
  confidence: number; // 0..1
  top_assets: AssetReturn[];
  as_of: string; // ISO date
}

export interface RegimeHistoryPoint {
  date: string; // YYYY-MM
  regime: string;
  growth_composite: number; // -1..1 ish
  indicators?: Record<string, number>;
}

export interface RegimeHistoryResponse {
  start: string;
  end: string;
  points: RegimeHistoryPoint[];
}

export interface AnalogueMatch {
  date: string;
  regime: string;
  similarity: number;
  forward_returns_12m: AssetReturn[];
}

export interface RegimeAnaloguesResponse {
  date: string;
  regime: string;
  matches: AnalogueMatch[];
}

export interface InsightAsset {
  asset: string;
  annualized_return: number;
  mean_monthly_return?: number;
  win_rate?: number;
  month_count?: number;
}

export interface TransitionRisk {
  from: string;
  to: string;
  prob: number;
}

export interface RegimeInsightResponse {
  regime: string;
  insight: string;
  top_assets: InsightAsset[];
  risk_outlook: TransitionRisk[];
}

export interface ApiError {
  status: number;
  message: string;
}
