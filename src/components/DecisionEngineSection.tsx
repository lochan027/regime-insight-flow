import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, RefreshCw, Scale } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentRegime, getRegimeInsight } from "@/lib/api";
import { formatConfidence, formatPct } from "@/lib/format";

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

function inferAction(regime: string) {
  if (/(inflation|stagflation)/i.test(regime)) {
    return "Trim duration, keep a gold sleeve, and favor pricing-power equities over long-duration growth.";
  }
  if (/(deflation|bust)/i.test(regime)) {
    return "Increase high-quality bonds, reduce cyclicals, and keep dry powder for volatility spikes.";
  }
  if (/(goldilocks|reflation|boom|recovery)/i.test(regime)) {
    return "Lean pro-risk: maintain equity exposure, add selective cyclicals, and rebalance winners monthly.";
  }
  return "Keep a balanced allocation and rebalance toward strategic targets while monitoring transition risk.";
}

function impactHint(regime: string) {
  if (/(inflation|stagflation)/i.test(regime)) return "Inflation risk rising: commodities and real assets typically gain support.";
  if (/(deflation|bust)/i.test(regime)) return "Growth scare risk rising: duration and defensive sectors tend to hold up better.";
  if (/(goldilocks|reflation|boom|recovery)/i.test(regime)) return "Risk appetite improving: equities and credit often lead.";
  return "Macro mix is shifting: keep risk budgets flexible and rebalance gradually.";
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

export function DecisionEngineSection() {
  const [question, setQuestion] = useState("What should I do right now?");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotResult, setCopilotResult] = useState<{ explanation: string; action: string } | null>(null);

  const [weights, setWeights] = useState<Weights>({ stocks: 60, bonds: 30, gold: 10 });
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [portfolioResult, setPortfolioResult] = useState<{
    regime: string;
    expected: ReturnMap;
    expectedPortfolioReturn: number;
    suggested: Weights;
  } | null>(null);

  const weightsNormalized = useMemo(() => normalizeWeights(weights), [weights]);

  async function runCopilot() {
    setCopilotLoading(true);
    setCopilotError(null);
    setCopilotResult(null);
    try {
      const [current, insight] = await Promise.all([
        getCurrentRegime(),
        getRegimeInsight().catch(() => null),
      ]);
      const regime = current.data.regime;
      const confidence = formatConfidence(current.data.confidence);
      const top = insight?.data.top_assets?.[0]?.asset ?? current.data.top_assets?.[0]?.asset ?? "the leading asset class";
      const explanation = `${question.trim() || "Current read"} ${regime} is active with ${confidence} confidence. ${top} is currently leading.`;
      const action = inferAction(regime);
      setCopilotResult({ explanation, action });
    } catch (e: any) {
      setCopilotError(e?.message ?? "Unable to load Copilot answer");
    } finally {
      setCopilotLoading(false);
    }
  }

  async function runPortfolioImpact() {
    setPortfolioLoading(true);
    setPortfolioError(null);
    setPortfolioResult(null);
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
      setPortfolioResult({
        regime: current.data.regime,
        expected,
        expectedPortfolioReturn,
        suggested,
      });
    } catch (e: any) {
      setPortfolioError(e?.message ?? "Unable to analyze portfolio");
    } finally {
      setPortfolioLoading(false);
    }
  }



  return (
    <section id="copilot" className="relative py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="Decision engine"
          title="Two AI-style options for action"
          description="Option A: Copilot guidance. Option B: Portfolio impact and rebalance."
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="surface rounded-2xl p-5 md:p-7"
        >
          <Tabs defaultValue="a" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="a">Option A · AI Copilot</TabsTrigger>
              <TabsTrigger value="b">Option B · Portfolio Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="a" className="mt-5 space-y-4">
              <div className="text-xs text-muted-foreground rounded-lg border hairline bg-surface-2 px-3 py-2">
                Perplexity API can be used, but call it from a backend/proxy endpoint to keep API keys out of the browser.
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What should I do right now?" />
                <Button onClick={runCopilot} disabled={copilotLoading}>
                  {copilotLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} Run Copilot
                </Button>
              </div>
              {copilotError && <div className="text-sm text-destructive">{copilotError}</div>}
              {copilotResult && (
                <div className="rounded-xl border hairline bg-surface-2/60 p-4 space-y-2">
                  <div className="text-sm"><span className="text-muted-foreground">Explanation:</span> {copilotResult.explanation}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Action:</span> {copilotResult.action}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="b" className="mt-5 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <WeightInput label="Stocks" value={weights.stocks} onChange={(v) => setWeights((w) => ({ ...w, stocks: v }))} />
                <WeightInput label="Bonds" value={weights.bonds} onChange={(v) => setWeights((w) => ({ ...w, bonds: v }))} />
                <WeightInput label="Gold" value={weights.gold} onChange={(v) => setWeights((w) => ({ ...w, gold: v }))} />
              </div>
              <div className="text-xs text-muted-foreground">Normalized weights: Stocks {weightsNormalized.stocks}% · Bonds {weightsNormalized.bonds}% · Gold {weightsNormalized.gold}%</div>
              <Button onClick={runPortfolioImpact} disabled={portfolioLoading}>
                {portfolioLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />} Analyze Portfolio
              </Button>
              {portfolioError && <div className="text-sm text-destructive">{portfolioError}</div>}
              {portfolioResult && (
                <div className="rounded-xl border hairline bg-surface-2/60 p-4 space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Current regime:</span> {portfolioResult.regime}</div>
                  <div><span className="text-muted-foreground">Expected annualized return in this regime:</span> {formatPct(portfolioResult.expectedPortfolioReturn * 100, 1)}</div>
                  <div><span className="text-muted-foreground">Suggested rebalance:</span> Stocks {portfolioResult.suggested.stocks}% · Bonds {portfolioResult.suggested.bonds}% · Gold {portfolioResult.suggested.gold}%</div>
                </div>
              )}
            </TabsContent>


          </Tabs>
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
