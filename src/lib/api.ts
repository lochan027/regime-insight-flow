import { API_BASE_URL, USE_MOCK } from "./constants";
import type {
  CurrentRegimeResponse,
  RegimeAnaloguesResponse,
  RegimeHistoryResponse,
} from "@/types/api";

export interface HistoryParams {
  start?: string;
  end?: string;
  include_indicators?: boolean;
}
export interface AnaloguesParams {
  date: string;
  n?: number;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function buildUrl(path: string, params?: Record<string, any>) {
  return `${API_BASE_URL}${path}${params ? qs(params) : ""}`;
}

async function request<T>(path: string, params?: Record<string, any>): Promise<{
  data: T;
  status: number;
  ms: number;
}> {
  const start = performance.now();
  if (USE_MOCK) {
    const data = await mockResponse<T>(path, params);
    const ms = Math.round(180 + Math.random() * 220);
    await new Promise((r) => setTimeout(r, ms));
    return { data, status: 200, ms: Math.round(performance.now() - start) };
  }
  const res = await fetch(buildUrl(path, params), {
    headers: { Accept: "application/json" },
  });
  const ms = Math.round(performance.now() - start);
  if (!res.ok) {
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  }
  const data = (await res.json()) as T;
  return { data, status: res.status, ms };
}

export const getCurrentRegime = () =>
  request<CurrentRegimeResponse>("/regime/current");

export const getRegimeHistory = (params: HistoryParams = {}) =>
  request<RegimeHistoryResponse>("/regime/history", params);

export const getRegimeAnalogues = (params: AnaloguesParams) =>
  request<RegimeAnaloguesResponse>("/regime/analogues", params);

/* ---------------- MOCK DATA ---------------- */

const REGIMES = ["Goldilocks", "Reflation", "Stagflation", "Deflation"] as const;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateHistory(start = "2000-01", end?: string) {
  const startDate = new Date(start + "-01");
  const endDate = end ? new Date(end + "-01") : new Date();
  const rand = seeded(42);
  const points = [];
  let regime: string = "Reflation";
  let growth = 0.2;
  const cur = new Date(startDate);
  let monthsLeft = 6 + Math.floor(rand() * 18);
  while (cur <= endDate) {
    if (monthsLeft-- <= 0) {
      regime = REGIMES[Math.floor(rand() * REGIMES.length)];
      monthsLeft = 6 + Math.floor(rand() * 24);
    }
    const target =
      regime === "Goldilocks" ? 0.6 :
      regime === "Reflation" ? 0.3 :
      regime === "Stagflation" ? -0.1 : -0.5;
    growth += (target - growth) * 0.25 + (rand() - 0.5) * 0.18;
    points.push({
      date: cur.toISOString().slice(0, 7),
      regime,
      growth_composite: Math.max(-1, Math.min(1, +growth.toFixed(3))),
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return points;
}

async function mockResponse<T>(path: string, params?: Record<string, any>): Promise<T> {
  if (path === "/regime/current") {
    const resp: CurrentRegimeResponse = {
      regime: "Goldilocks",
      in_place_since: "2024-08-01",
      months_in_regime: 8,
      confidence: 0.78,
      top_assets: [
        { asset: "US Equities", return_pct: 14.2 },
        { asset: "Tech (NDX)", return_pct: 18.6 },
        { asset: "Investment Grade Credit", return_pct: 6.4 },
      ],
      as_of: new Date().toISOString().slice(0, 10),
    };
    return resp as unknown as T;
  }
  if (path === "/regime/history") {
    const points = generateHistory(params?.start ?? "2000-01", params?.end);
    if (params?.include_indicators) {
      points.forEach((p) => ((p as any).indicators = {
        UNRATE: 3.5 + Math.random(),
        CPIAUCSL: 2 + Math.random() * 3,
        INDPRO: 95 + Math.random() * 10,
      }));
    }
    return { start: points[0]?.date, end: points.at(-1)?.date, points } as unknown as T;
  }
  if (path === "/regime/analogues") {
    const n = Math.max(1, Math.min(10, Number(params?.n ?? 3)));
    const baseDates = ["1995-06-01","2004-03-01","2014-09-01","2017-11-01","2019-02-01","1998-04-01","2010-07-01","2006-05-01","1993-11-01","2013-04-01"];
    const matches = Array.from({ length: n }).map((_, i) => ({
      date: baseDates[i % baseDates.length],
      regime: "Goldilocks",
      similarity: +(0.92 - i * 0.04).toFixed(3),
      forward_returns_12m: [
        { asset: "US Equities", return_pct: +(8 + Math.random() * 14).toFixed(1) },
        { asset: "US Treasuries 10Y", return_pct: +(2 + Math.random() * 4).toFixed(1) },
        { asset: "Gold", return_pct: +(-2 + Math.random() * 10).toFixed(1) },
      ],
    }));
    return {
      date: params?.date ?? new Date().toISOString().slice(0, 10),
      regime: "Goldilocks",
      matches,
    } as unknown as T;
  }
  throw new Error(`Unknown mock path: ${path}`);
}
