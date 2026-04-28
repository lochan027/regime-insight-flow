import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentRegime } from "@/hooks/useCurrentRegime";
import {
  formatConfidence,
  formatDate,
  formatPct,
  getRegimeColor,
  getRegimeTextClass,
} from "@/lib/format";

export function HeroLiveCard() {
  const { data, loading, error, isFallback, refetch } = useCurrentRegime();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative"
    >
      <div className="absolute -inset-px rounded-[1.25rem] bg-gradient-to-br from-primary/30 via-transparent to-regime-blue/20 blur-xl opacity-60" aria-hidden />
      <div className="relative surface rounded-2xl p-6 md:p-7">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span className="live-dot" /> Live regime
          </div>
          <span className="text-xs text-muted-foreground font-mono">/regime/current</span>
        </div>

        <div className="mt-6 min-h-[260px]">
          {loading && <LoadingState />}
          {error && !loading && <ErrorState onRetry={refetch} />}
          {data && !loading && !error && (
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className={`text-4xl md:text-5xl font-semibold tracking-tight ${getRegimeTextClass(data.regime)}`}>
                    {data.regime}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    As of <span className="text-foreground">{formatDate(data.as_of, { month: "short", year: "numeric" })}</span> ·{" "}
                    in place since <span className="text-foreground">{formatDate(data.in_place_since)}</span> ·{" "}
                    <span className="text-foreground">{data.months_in_regime} months in regime</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Confidence</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatConfidence(data.confidence)}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.confidence * 100}%` }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${getRegimeColor(data.regime)}, hsl(var(--primary-glow)))` }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Top performing assets
                </div>
                {data.top_assets.length === 0 && (
                  <div className="text-sm text-muted-foreground rounded-lg border hairline bg-surface-2 px-3 py-2">
                    Asset outlook is unavailable in fallback mode.
                  </div>
                )}
                <ul className="space-y-3">
                  {data.top_assets.map((a, i) => {
                    const max = Math.max(...data.top_assets.map((x) => Math.abs(x.return_pct)));
                    const w = (Math.abs(a.return_pct) / max) * 100;
                    return (
                      <li key={a.asset}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground/90">{a.asset}</span>
                          <span className={`font-mono tabular-nums ${a.return_pct >= 0 ? "text-primary" : "text-regime-red"}`}>
                            {formatPct(a.return_pct)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-surface-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${w}%` }}
                            transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: a.return_pct >= 0 ? "hsl(var(--primary))" : "hsl(var(--regime-red))" }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t hairline flex items-center justify-between text-xs text-muted-foreground">
                <span>As of {formatDate(data.as_of, { month: "long", day: "numeric", year: "numeric" })}</span>
                <button onClick={refetch} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              {isFallback && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  Using latest value from history because /regime/current is currently unavailable.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-2/3 rounded-md bg-surface-3" />
      <div className="h-4 w-1/2 rounded-md bg-surface-3" />
      <div className="h-1.5 w-full rounded-full bg-surface-3" />
      <div className="space-y-3 pt-3">
        {[0,1,2].map((i) => (
          <div key={i}>
            <div className="h-3 w-1/3 rounded bg-surface-3 mb-2" />
            <div className="h-1 w-full rounded bg-surface-3" />
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading regime…
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
      <div className="inline-flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Unable to reach API</span>
      </div>
      <p className="text-xs text-muted-foreground">
        We couldn't load the current regime. Please try again.
      </p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}
