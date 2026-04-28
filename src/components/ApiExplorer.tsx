import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/constants";
import { buildUrl, getCurrentRegime, getRegimeAnalogues, getRegimeHistory } from "@/lib/api";
import { SectionHeader } from "./SectionHeader";

type TabKey = "current" | "history" | "analogues";

interface Preset {
  label: string;
  tab: TabKey;
  apply?: (s: ExplorerState) => Partial<ExplorerState>;
}

interface ExplorerState {
  start: string;
  end: string;
  includeIndicators: boolean;
  date: string;
  n: number;
}

const today = () => new Date().toISOString().slice(0, 10);

const PRESETS: Preset[] = [
  { label: "Current regime today", tab: "current" },
  {
    label: "2008 financial crisis",
    tab: "history",
    apply: () => ({ start: "2007-01-01", end: "2009-12-01", includeIndicators: true }),
  },
  {
    label: "2021 inflation surge",
    tab: "history",
    apply: () => ({ start: "2021-01-01", end: "2022-12-01", includeIndicators: true }),
  },
  {
    label: "Historical analogues today",
    tab: "analogues",
    apply: () => ({ date: today(), n: 5 }),
  },
];

export function ApiExplorer() {
  const [tab, setTab] = useState<TabKey>("current");
  const [state, setState] = useState<ExplorerState>({
    start: "2010-01-01",
    end: today(),
    includeIndicators: false,
    date: today(),
    n: 3,
  });
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<{ code: number; ms: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const curl = useMemo(() => {
    if (tab === "current") return `curl -s ${API_BASE_URL}/regime/current`;
    if (tab === "history") {
      const url = buildUrl("/regime/history", {
        start: state.start, end: state.end,
        include_indicators: state.includeIndicators || undefined,
      });
      return `curl -s "${url}"`;
    }
    return `curl -s "${buildUrl("/regime/analogues", { date: state.date, n: state.n })}"`;
  }, [tab, state]);

  async function send(targetTab = tab, override?: Partial<ExplorerState>) {
    const s = { ...state, ...override };
    setLoading(true); setError(null); setResponse(null); setStatus(null);
    try {
      let res;
      if (targetTab === "current") res = await getCurrentRegime();
      else if (targetTab === "history")
        res = await getRegimeHistory({
          start: s.start, end: s.end,
          include_indicators: s.includeIndicators,
        });
      else res = await getRegimeAnalogues({ date: s.date, n: s.n });
      setResponse(res.data);
      setStatus({ code: res.status, ms: res.ms });
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
      setStatus({ code: e?.status ?? 0, ms: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void send("current"); /* initial */ // eslint-disable-next-line
  }, []);

  function applyPreset(p: Preset) {
    const patch = p.apply?.(state) ?? {};
    setState((s) => ({ ...s, ...patch }));
    setTab(p.tab);
    void send(p.tab, patch);
  }

  async function copyJson() {
    if (!response) return;
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    toast({ title: "Copied", description: "Response copied to clipboard" });
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section id="explorer" className="relative py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="Live API explorer"
          title="Try every endpoint, right here"
          description="Configure parameters, watch the request build live, and inspect formatted JSON responses."
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="group inline-flex items-center gap-1.5 rounded-full border hairline bg-surface-2/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              <Sparkles className="h-3 w-3 text-primary opacity-70 group-hover:opacity-100" />
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="surface rounded-2xl p-5 md:p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="current">Current regime</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="analogues">Analogues</TabsTrigger>
              </TabsList>

              <div className="relative mt-5 min-h-[230px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {tab === "current" && (
                      <p className="text-sm text-muted-foreground">
                        No parameters required. Returns the current regime, confidence,
                        the date the regime began, and top performing asset classes.
                      </p>
                    )}
                    {tab === "history" && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="start">Start date</Label>
                          <Input id="start" type="date" value={state.start}
                            onChange={(e) => setState((s) => ({ ...s, start: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="end">End date</Label>
                          <Input id="end" type="date" value={state.end}
                            onChange={(e) => setState((s) => ({ ...s, end: e.target.value }))} />
                        </div>
                        <label className="sm:col-span-2 inline-flex items-center gap-2 mt-1 text-sm cursor-pointer">
                          <Checkbox
                            checked={state.includeIndicators}
                            onCheckedChange={(c) => setState((s) => ({ ...s, includeIndicators: !!c }))}
                          />
                          Include underlying indicators
                        </label>
                      </div>
                    )}
                    {tab === "analogues" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="date">Reference date</Label>
                          <Input id="date" type="date" value={state.date}
                            onChange={(e) => setState((s) => ({ ...s, date: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Number of analogues</Label>
                            <span className="text-sm font-mono tabular-nums text-primary">{state.n}</span>
                          </div>
                          <Slider min={1} max={10} step={1}
                            value={[state.n]}
                            onValueChange={([v]) => setState((s) => ({ ...s, n: v }))}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live cURL</div>
              <pre className="font-mono text-xs leading-relaxed surface-2 rounded-xl p-3 overflow-x-auto scrollbar-thin">
                <code className="text-foreground/90">{curl}</code>
              </pre>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button onClick={() => send()} disabled={loading} className="shadow-glow">
                {loading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : <Play className="h-4 w-4" />}
                Send Request
              </Button>
              <span className="text-xs text-muted-foreground">
                {loading ? "Sending…" : status ? `Completed in ${status.ms}ms` : "Idle"}
              </span>
            </div>
          </div>

          {/* Response */}
          <div className="surface rounded-2xl p-5 md:p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Response</div>
              <div className="flex items-center gap-2">
                {status && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono
                    ${status.code >= 200 && status.code < 300 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {status.code || "ERR"}
                  </span>
                )}
                {status && (
                  <span className="text-xs text-muted-foreground font-mono">{status.ms}ms</span>
                )}
                <button
                  onClick={copyJson}
                  disabled={!response}
                  className="inline-flex items-center gap-1.5 rounded-md surface-2 px-2.5 py-1 text-xs hover:bg-surface-3 disabled:opacity-40"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex-1 min-h-[280px] surface-2 rounded-xl p-4 overflow-auto scrollbar-thin">
              {error && <div className="text-sm text-destructive">⚠ {error}</div>}
              {!error && !response && (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  Send a request to see the response here.
                </div>
              )}
              {response && (
                <pre className="font-mono text-xs leading-relaxed">
                  <JsonView value={response} />
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Tiny syntax-colored JSON viewer */
function JsonView({ value }: { value: any }) {
  const json = JSON.stringify(value, null, 2);
  const parts = json.split(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?)/g);
  return (
    <code>
      {parts.map((p, i) => {
        if (!p) return null;
        if (/^"/.test(p)) {
          if (/:$/.test(p)) return <span key={i} className="text-regime-blue">{p}</span>;
          return <span key={i} className="text-primary">{p}</span>;
        }
        if (/^(true|false|null)$/.test(p)) return <span key={i} className="text-regime-amber">{p}</span>;
        if (/^-?\d/.test(p)) return <span key={i} className="text-regime-coral">{p}</span>;
        return <span key={i} className="text-foreground/80">{p}</span>;
      })}
    </code>
  );
}
