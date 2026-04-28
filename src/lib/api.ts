import { API_BASE_URL, USE_MOCK } from "./constants";
import type {
  CurrentRegimeResponse,
  RegimeInsightResponse,
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

function toIsoDate(value: unknown, fallback = new Date().toISOString().slice(0, 10)) {
  if (typeof value !== "string" || !value) return fallback;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString().slice(0, 10);
}

function subtractMonths(isoDate: string, months: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

const ASSET_LABELS: Record<string, string> = {
  eq_us: "US Equities",
  bond_long: "Long Duration Bonds",
  credit_ig: "Investment Grade Credit",
  cash: "Cash",
  gold: "Gold",
  commodities: "Commodities",
};

function formatAssetLabel(assetKey: unknown) {
  const key = String(assetKey ?? "").trim();
  if (ASSET_LABELS[key]) return ASSET_LABELS[key];
  if (!key) return "Unknown Asset";
  return key
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function humanizeInsightText(text: unknown) {
  if (typeof text !== "string") return "";
  return Object.entries(ASSET_LABELS).reduce((acc, [key, label]) => {
    const re = new RegExp(`\\b${key}\\b`, "g");
    return acc.replace(re, label);
  }, text);
}

function inferGrowthComposite(regime: string) {
  const lookup: Record<string, number> = {
    Goldilocks: 0.55,
    Reflation: 0.3,
    Recovery: 0.25,
    "Inflationary Boom": 0.2,
    Overheating: 0.1,
    "Slow Grind": -0.05,
    Stagflation: -0.25,
    Deflation: -0.6,
    "Deflationary Bust": -0.7,
  };
  return lookup[regime] ?? 0;
}

function normalizeCurrentRegime(data: any): CurrentRegimeResponse {
  // Legacy schema (already expected by UI)
  if (data && typeof data.regime === "string" && Array.isArray(data.top_assets)) {
    return data as CurrentRegimeResponse;
  }

  // New schema from live API
  if (data?.regime && typeof data.regime === "object") {
    const regimeName = String(data.regime.regime ?? "Unknown");
    const asOf = toIsoDate(data.regime.date);
    const months = Number(data.regime.streak_months ?? 1);
    const inPlaceSince = subtractMonths(asOf, Math.max(0, months - 1));

    const assets = Array.isArray(data.asset_outlook?.assets) ? data.asset_outlook.assets : [];
    const top_assets = assets
      .map((a: any) => ({
        asset: formatAssetLabel(a.asset),
        return_pct: Number(((a.annualized_return ?? 0) as number) * 100),
      }))
      .filter((a: any) => Number.isFinite(a.return_pct));

    const transitionRows = Array.isArray(data.transitions?.transitions)
      ? data.transitions.transitions
      : [];
    const stayTransition = transitionRows.find(
      (t: any) => t?.from === regimeName && t?.to === regimeName,
    );
    const confidenceRaw = Number(stayTransition?.prob);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0;

    return {
      regime: regimeName,
      in_place_since: inPlaceSince,
      months_in_regime: Number.isFinite(months) ? months : 1,
      confidence,
      top_assets,
      as_of: asOf,
    };
  }

  throw new Error("Unexpected /regime/current response shape");
}

function normalizeHistory(data: any): RegimeHistoryResponse {
  // Legacy schema
  if (Array.isArray(data?.points)) {
    return data as RegimeHistoryResponse;
  }

  // New schema from live API
  if (Array.isArray(data?.history)) {
    const points = data.history.map((p: any) => ({
      date: toIsoDate(p?.date).slice(0, 7),
      regime: String(p?.regime ?? "Unknown"),
      growth_composite: Number.isFinite(p?.growth_composite)
        ? Number(p.growth_composite)
        : inferGrowthComposite(String(p?.regime ?? "Unknown")),
      indicators: p?.indicators,
    }));
    return {
      start: toIsoDate(data.start).slice(0, 7),
      end: toIsoDate(data.end).slice(0, 7),
      points,
    };
  }

  throw new Error("Unexpected /regime/history response shape");
}

function normalizeInsight(data: any): RegimeInsightResponse {
  if (typeof data?.regime !== "string" || typeof data?.insight !== "string") {
    throw new Error("Unexpected /regime/insight response shape");
  }
  const top_assets = (Array.isArray(data.top_assets) ? data.top_assets : [])
    .map((a: any) => ({
      asset: formatAssetLabel(a?.asset),
      annualized_return: Number(a?.annualized_return ?? 0),
      mean_monthly_return: Number(a?.mean_monthly_return ?? 0),
      win_rate: Number(a?.win_rate ?? 0),
      month_count: Number(a?.month_count ?? 0),
    }))
    .filter((a: any) => Number.isFinite(a.annualized_return));

  const risk_outlook = (Array.isArray(data.risk_outlook) ? data.risk_outlook : [])
    .map((r: any) => ({
      from: String(r?.from ?? data.regime),
      to: String(r?.to ?? "Unknown"),
      prob: Number(r?.prob ?? 0),
    }))
    .filter((r: any) => Number.isFinite(r.prob));

  return {
    regime: data.regime,
    insight: humanizeInsightText(data.insight),
    top_assets,
    risk_outlook,
  };
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
  request<any>("/regime/current").then((r) => ({ ...r, data: normalizeCurrentRegime(r.data) }));

function parseHistoryDate(input: string) {
  const s = input?.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}$/.test(s)) {
    return new Date(`${s}-01T00:00:00Z`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T00:00:00Z`);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function withinHistoryRange(pointDate: string, params: HistoryParams) {
  const p = parseHistoryDate(pointDate);
  if (!p) return false;
  const start = params.start ? parseHistoryDate(params.start) : null;
  const end = params.end ? parseHistoryDate(params.end) : null;
  if (start && p < start) return false;
  if (end && p > end) return false;
  return true;
}

function filterHistoryLocally(data: RegimeHistoryResponse, params: HistoryParams): RegimeHistoryResponse {
  const points = data.points.filter((p) => withinHistoryRange(p.date, params));
  return {
    start: points[0]?.date ?? data.start,
    end: points.at(-1)?.date ?? data.end,
    points,
  };
}

export async function getRegimeHistory(params: HistoryParams = {}) {
  try {
    const res = await request<any>("/regime/history", params);
    return { ...res, data: normalizeHistory(res.data) };
  } catch (e: any) {
    // Some deployments reject query filtering even though docs list these params.
    // Fall back to full history and filter client-side to keep UX working.
    const hasRange = Boolean(params.start || params.end);
    if (!USE_MOCK && hasRange && (e?.status === 400 || e?.status === 422)) {
      const raw = await request<any>("/regime/history", {
        include_indicators: params.include_indicators,
      });
      const normalized = normalizeHistory(raw.data);
      return { ...raw, data: filterHistoryLocally(normalized, params) };
    }
    throw e;
  }
}

export const getRegimeAnalogues = (params: AnaloguesParams) =>
  request<RegimeAnaloguesResponse>("/regime/analogues", params);

export const getRegimeInsight = () =>
  request<any>("/regime/insight").then((r) => ({ ...r, data: normalizeInsight(r.data) }));

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
  if (path === "/regime/insight") {
    return {
      regime: "Goldilocks",
      insight: "We are currently in Goldilocks. Equities are outperforming while transition risk is concentrated in a shift toward Reflation.",
      top_assets: [
        { asset: "US Equities", annualized_return: 0.142, mean_monthly_return: 0.011, win_rate: 0.66, month_count: 96 },
        { asset: "Tech (NDX)", annualized_return: 0.186, mean_monthly_return: 0.014, win_rate: 0.64, month_count: 96 },
        { asset: "Investment Grade Credit", annualized_return: 0.064, mean_monthly_return: 0.005, win_rate: 0.61, month_count: 96 },
      ],
      risk_outlook: [
        { from: "Goldilocks", to: "Goldilocks", prob: 0.71 },
        { from: "Goldilocks", to: "Reflation", prob: 0.19 },
        { from: "Goldilocks", to: "Stagflation", prob: 0.10 },
      ],
    } as unknown as T;
  }
  throw new Error(`Unknown mock path: ${path}`);
}
