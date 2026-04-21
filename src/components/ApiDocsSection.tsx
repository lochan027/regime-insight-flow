import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Lock, Zap } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { API_BASE_URL, SWAGGER_URL } from "@/lib/constants";

interface Endpoint {
  method: "GET";
  path: string;
  desc: string;
  params: { name: string; type: string; required?: boolean; desc: string }[];
  fields: { name: string; type: string; desc: string }[];
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/regime/current",
    desc: "Returns the current macro regime, confidence score, and top performing asset classes.",
    params: [],
    fields: [
      { name: "regime", type: "string", desc: "Regime label (e.g. Goldilocks)" },
      { name: "confidence", type: "number", desc: "Model confidence, 0–1" },
      { name: "in_place_since", type: "date", desc: "When this regime began" },
      { name: "top_assets", type: "array", desc: "Top performing asset classes in regime" },
    ],
  },
  {
    method: "GET",
    path: "/regime/history",
    desc: "Returns monthly regime classifications and the growth composite from 1990 onwards.",
    params: [
      { name: "start", type: "string", desc: "YYYY-MM start month" },
      { name: "end", type: "string", desc: "YYYY-MM end month" },
      { name: "include_indicators", type: "boolean", desc: "Include all 25 raw indicators" },
    ],
    fields: [
      { name: "points[].date", type: "string", desc: "Year-month identifier" },
      { name: "points[].regime", type: "string", desc: "Assigned regime label" },
      { name: "points[].growth_composite", type: "number", desc: "Composite growth score" },
    ],
  },
  {
    method: "GET",
    path: "/regime/analogues",
    desc: "Returns the historical months most similar to a given reference date.",
    params: [
      { name: "date", type: "string", required: true, desc: "Reference date (YYYY-MM-DD)" },
      { name: "n", type: "integer", desc: "Number of analogues, 1–10 (default 3)" },
    ],
    fields: [
      { name: "matches[].date", type: "date", desc: "Analogue month" },
      { name: "matches[].similarity", type: "number", desc: "Similarity score, 0–1" },
      { name: "matches[].forward_returns_12m", type: "array", desc: "Subsequent 12-month asset returns" },
    ],
  },
];

const samples = (path: string) => ({
  curl: `curl -s ${API_BASE_URL}${path}`,
  js: `const res = await fetch("${API_BASE_URL}${path}");
const data = await res.json();`,
  py: `import requests
data = requests.get("${API_BASE_URL}${path}").json()`,
});

type Lang = "curl" | "js" | "py";

export function ApiDocsSection() {
  return (
    <section id="docs" className="relative py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="API reference"
          title="Three endpoints. Clean JSON. No auth required."
          description="Designed to be readable in 60 seconds and integrated in five minutes."
        />

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <InfoCard icon={Zap} label="Base URL"
            value={<code className="font-mono text-sm break-all">{API_BASE_URL}</code>} />
          <InfoCard icon={Lock} label="Auth"
            value={<span className="text-sm">No API key required for public endpoints</span>} />
          <InfoCard icon={ExternalLink} label="Interactive docs"
            value={
              <a href={SWAGGER_URL} target="_blank" rel="noreferrer"
                 className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                Open Swagger UI <ExternalLink className="h-3.5 w-3.5" />
              </a>
            } />
        </div>

        <p className="text-xs text-muted-foreground mb-8">
          Rate limit: 60 requests / minute per IP. JSON only. Responses gzip-compressed.
        </p>

        <div className="space-y-6">
          {ENDPOINTS.map((e, i) => (
            <EndpointCard key={e.path} endpoint={e} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <div className="mt-2">{value}</div>
    </div>
  );
}

function EndpointCard({ endpoint, index }: { endpoint: Endpoint; index: number }) {
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);
  const code = samples(endpoint.path)[lang];

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="surface rounded-2xl overflow-hidden"
    >
      <div className="p-5 md:p-6 border-b hairline">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-md bg-primary/15 text-primary px-2 py-0.5 text-xs font-mono font-semibold">
            {endpoint.method}
          </span>
          <code className="font-mono text-sm md:text-base text-foreground">{endpoint.path}</code>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{endpoint.desc}</p>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="p-5 md:p-6 lg:border-r hairline">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Parameters</div>
          {endpoint.params.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parameters.</p>
          ) : (
            <div className="rounded-xl border hairline overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {endpoint.params.map((p) => (
                    <tr key={p.name} className="border-b hairline last:border-0">
                      <td className="px-3 py-2.5 align-top w-1/3">
                        <code className="font-mono text-xs">{p.name}</code>
                        {p.required && <span className="ml-1 text-[10px] text-destructive">*</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        <div className="font-mono text-foreground/70">{p.type}</div>
                        <div className="mt-0.5">{p.desc}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-3">Response</div>
          <div className="rounded-xl border hairline overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {endpoint.fields.map((f) => (
                  <tr key={f.name} className="border-b hairline last:border-0">
                    <td className="px-3 py-2.5 align-top w-1/2">
                      <code className="font-mono text-xs">{f.name}</code>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      <div className="font-mono text-foreground/70">{f.type}</div>
                      <div className="mt-0.5">{f.desc}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-surface-2/30">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex rounded-lg surface-2 p-0.5">
              {(["curl","js","py"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    lang === l ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {l === "curl" ? "cURL" : l === "js" ? "JavaScript" : "Python"}
                </button>
              ))}
            </div>
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md surface-2 px-2.5 py-1 text-xs hover:bg-surface-3">
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="font-mono text-xs leading-relaxed surface-2 rounded-xl p-4 overflow-x-auto scrollbar-thin">
            <code className="text-foreground/85 whitespace-pre">{code}</code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
