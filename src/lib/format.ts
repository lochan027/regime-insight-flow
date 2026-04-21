export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso.length === 7 ? iso + "-01" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", opts ?? { month: "short", year: "numeric" });
}

export function formatPct(n: number, digits = 1) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatConfidence(c: number) {
  return `${Math.round(c * 100)}%`;
}

const REGIME_COLOR: Record<string, string> = {
  Goldilocks: "hsl(var(--regime-green))",
  Reflation: "hsl(var(--regime-blue))",
  Recovery: "hsl(var(--regime-blue))",
  Overheating: "hsl(var(--regime-amber))",
  Stagflation: "hsl(var(--regime-coral))",
  Deflation: "hsl(var(--regime-red))",
  Unknown: "hsl(var(--regime-gray))",
};

export function getRegimeColor(name: string) {
  return REGIME_COLOR[name] ?? "hsl(var(--regime-purple))";
}

export function getRegimeTextClass(name: string) {
  switch (name) {
    case "Goldilocks": return "text-regime-green";
    case "Reflation":
    case "Recovery": return "text-regime-blue";
    case "Overheating": return "text-regime-amber";
    case "Stagflation": return "text-regime-coral";
    case "Deflation": return "text-regime-red";
    default: return "text-regime-purple";
  }
}
