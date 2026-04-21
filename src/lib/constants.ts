export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://api.example.com";

// When base URL is the placeholder, the API client serves rich mock data
// so the UI is fully alive during development.
export const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;

export const SWAGGER_URL = `${API_BASE_URL}/docs`;

export const REGIME_DESCRIPTIONS: Record<string, string> = {
  Goldilocks: "Strong growth, contained inflation. Risk assets typically lead.",
  Reflation: "Accelerating growth coming off a trough. Cyclicals & credit shine.",
  Stagflation: "Sticky inflation, slowing growth. Commodities & real assets favored.",
  Deflation: "Falling growth and inflation. Duration & quality outperform.",
  Recovery: "Growth turning higher from weakness. Small caps & cyclicals lead.",
  Overheating: "Late-cycle, peaking growth with rising inflation.",
};
