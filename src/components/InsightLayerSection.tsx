import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";
import { useRegimeInsight } from "@/hooks/useRegimeInsight";
import { formatPct, getRegimeTextClass } from "@/lib/format";

function pct(n: number) {
  return formatPct(n * 100, 1);
}

export function InsightLayerSection() {
  const { data, loading, error, refetch } = useRegimeInsight();

  return (
    <section id="insight" className="relative py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="Insight layer"
          title="A narrative view on the current regime"
          description="Live interpretation from /regime/insight with top opportunities and transition risk outlook."
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="surface rounded-2xl p-5 md:p-7"
        >
          {loading && <LoadingState />}
          {error && !loading && <ErrorState error={error} onRetry={refetch} />}
          {data && !loading && !error && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current regime</div>
                  <div className={`mt-1 text-3xl md:text-4xl font-semibold tracking-tight ${getRegimeTextClass(data.regime)}`}>
                    {data.regime}
                  </div>
                </div>
                <button
                  onClick={refetch}
                  className="inline-flex items-center gap-1.5 rounded-md surface-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh insight
                </button>
              </div>

              <div className="rounded-xl border hairline bg-surface-2/60 p-4 md:p-5">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Generated summary
                </div>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-foreground/90">{data.insight}</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-xl border hairline bg-surface-2/40 p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Top 3 assets
                  </div>
                  <ul className="mt-3 space-y-2.5">
                    {data.top_assets.slice(0, 3).map((a) => (
                      <li key={a.asset} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/90">{a.asset}</span>
                        <span className="font-mono tabular-nums text-primary">{pct(a.annualized_return)}</span>
                      </li>
                    ))}
                    {data.top_assets.length === 0 && (
                      <li className="text-sm text-muted-foreground">No asset insight returned.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border hairline bg-surface-2/40 p-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <TriangleAlert className="h-3.5 w-3.5 text-regime-amber" /> Transition risk outlook
                  </div>
                  <ul className="mt-3 space-y-2.5">
                    {data.risk_outlook.map((r, i) => (
                      <li key={`${r.from}-${r.to}-${i}`} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/90">{r.from} to {r.to}</span>
                        <span className="font-mono tabular-nums text-regime-amber">{pct(r.prob)}</span>
                      </li>
                    ))}
                    {data.risk_outlook.length === 0 && (
                      <li className="text-sm text-muted-foreground">No transition risk data returned.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded-md bg-surface-3" />
      <div className="h-20 w-full rounded-xl bg-surface-3" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-28 rounded-xl bg-surface-3" />
        <div className="h-28 rounded-xl bg-surface-3" />
      </div>
      <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading insight layer...
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
      <div className="inline-flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Unable to load insight</span>
      </div>
      <p className="text-xs text-muted-foreground">{error}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}
