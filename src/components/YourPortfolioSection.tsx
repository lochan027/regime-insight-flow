import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Scale, TrendingUp } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentRegime, getRegimeInsight } from "@/lib/api";
import { formatPct } from "@/lib/format";

interface Weights {
  stocks: number;
  bonds: number;
  gold: number;
}

interface ReturnMap {
  stocks: number;
  bonds: number;
  gold: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeWeights(w: Weights): Weights {
  const sum = Math.max(0.0001, w.stocks + w.bonds + w.gold);
  return {
    stocks: +(w.stocks * 100 / sum).toFixed(1),
    bonds: +(w.bonds * 100 / sum).toFixed(1),
    gold: +(w.gold * 100 / sum).toFixed(1),
  };
}

function pickReturns(topAssets: Array<{ asset: string; annualized_return: number }>, fallbackRegime: string): ReturnMap {
  const byName = new Map(topAssets.map((a) => [a.asset.toLowerCase(), a.annualized_return]));
  const stocks = byName.get("us equities") ?? byName.get("equities") ?? 0.085;
  const bonds = byName.get("long duration bonds") ?? byName.get("investment grade credit") ?? 0.032;
  const gold = byName.get("gold") ?? (/inflation/i.test(fallbackRegime) ? 0.09 : 0.05);
  return { stocks, bonds, gold };
}

function suggestRebalance(current: Weights, expected: ReturnMap): Weights {
  const avg = (expected.stocks + expected.bonds + expected.gold) / 3;
  const tilt = 35;
  const raw: Weights = {
    stocks: current.stocks + (expected.stocks - avg) * tilt,
    bonds: current.bonds + (expected.bonds - avg) * tilt,
    gold: current.gold + (expected.gold - avg) * tilt,
  };
  return normalizeWeights({
    stocks: clamp(raw.stocks, 5, 85),
    bonds: clamp(raw.bonds, 5, 85),
    gold: clamp(raw.gold, 5, 85),
  });
}

export function RegimeAllocatorSection() {
  const [weights, setWeights] = useState<Weights>({ stocks: 60, bonds: 30, gold: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    regime: string;
    expected: ReturnMap;
    expectedPortfolioReturn: number;
    suggested: Weights;
  } | null>(null);

  const weightsNormalized = useMemo(() => normalizeWeights(weights), [weights]);

  async function analyzePortfolio() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [current, insight] = await Promise.all([
        getCurrentRegime(),
        getRegimeInsight(),
      ]);
      const expected = pickReturns(insight.data.top_assets, current.data.regime);
      const normalized = normalizeWeights(weights);
      const expectedPortfolioReturn =
        normalized.stocks * expected.stocks / 100 +
        normalized.bonds * expected.bonds / 100 +
        normalized.gold * expected.gold / 100;
      const suggested = suggestRebalance(normalized, expected);
      setResult({
        regime: current.data.regime,
        expected,
        expectedPortfolioReturn,
        suggested,
      });
    } catch (e: any) {
      setError(e?.message ?? "Unable to analyze portfolio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="portfolio" className="relative py-20 md:py-28 bg-gradient-to-b from-background via-surface-2/30 to-background">
      <div className="container">
        <SectionHeader
          eyebrow="Portfolio Tools"
          title="Regime Allocator"
          description="Regime-aware portfolio intelligence system"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-2 gap-8"
        >
          {/* Input Section */}
          <div className="surface rounded-2xl p-5 md:p-7 space-y-5">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-600/20 p-2">
                <Scale className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Your Allocation</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Enter your current portfolio allocation across stocks, bonds, and gold.
            </p>

            <div className="space-y-4">
              <WeightInput
                label="Stocks"
                value={weights.stocks}
                onChange={(v) => setWeights((w) => ({ ...w, stocks: v }))}
              />
              <WeightInput
                label="Bonds"
                value={weights.bonds}
                onChange={(v) => setWeights((w) => ({ ...w, bonds: v }))}
              />
              <WeightInput
                label="Gold"
                value={weights.gold}
                onChange={(v) => setWeights((w) => ({ ...w, gold: v }))}
              />
            </div>

            <div className="rounded-lg border hairline bg-surface-2/40 p-3 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Normalized</div>
              <div className="flex justify-between text-sm">
                <span>Stocks: {weightsNormalized.stocks}%</span>
                <span>Bonds: {weightsNormalized.bonds}%</span>
                <span>Gold: {weightsNormalized.gold}%</span>
              </div>
            </div>

            <Button onClick={analyzePortfolio} disabled={loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              {loading ? "Analyzing..." : "Analyze Portfolio"}
            </Button>

            {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}
          </div>

          {/* Results Section */}
          <div>
            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="surface rounded-2xl p-5 md:p-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-green-600/20 p-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Analysis Results</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border hairline bg-surface-2/40 p-4 space-y-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Regime</div>
                      <div className="text-lg font-semibold">{result.regime}</div>
                    </div>

                    <div className="rounded-lg border hairline bg-surface-2/40 p-4 space-y-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Expected Portfolio Return</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPct(result.expectedPortfolioReturn * 100, 1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Annualized in current regime</div>
                    </div>

                    <div className="rounded-lg border hairline bg-surface-2/40 p-4 space-y-3">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Suggested Rebalance</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-sm font-semibold text-blue-600">{result.suggested.stocks}%</div>
                          <div className="text-xs text-muted-foreground">Stocks</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-amber-600">{result.suggested.bonds}%</div>
                          <div className="text-xs text-muted-foreground">Bonds</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-yellow-600">{result.suggested.gold}%</div>
                          <div className="text-xs text-muted-foreground">Gold</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border hairline bg-surface-2/40 p-4 text-xs space-y-2">
                      <div className="text-muted-foreground">
                        <span className="font-semibold">Expected Returns by Asset:</span> Stocks {formatPct(result.expected.stocks * 100, 1)} · Bonds {formatPct(result.expected.bonds * 100, 1)} · Gold {formatPct(result.expected.gold * 100, 1)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="surface rounded-2xl p-5 md:p-7 h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Set your allocation and click Analyze to see results</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WeightInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
    </div>
  );
}
