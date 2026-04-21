import { motion } from "framer-motion";
import {
  Briefcase, Code2, LineChart, Newspaper, Search, ShieldCheck,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const cards = [
  {
    icon: Briefcase,
    title: "Portfolio managers",
    desc: "Tilt allocations toward the asset classes that have historically led in the current regime.",
    code: "GET /regime/current",
  },
  {
    icon: LineChart,
    title: "Quant analysts",
    desc: "Backtest strategies conditioned on regime transitions instead of fixed calendar windows.",
    code: "GET /regime/history?start=2000-01",
  },
  {
    icon: Newspaper,
    title: "Financial journalists",
    desc: "Anchor stories with a clear, model-based read on where the macro cycle stands today.",
    code: "GET /regime/current",
  },
  {
    icon: Code2,
    title: "Fintech developers",
    desc: "Drop a regime indicator into dashboards, alerts, and onboarding with a single fetch call.",
    code: 'fetch("/regime/current")',
  },
  {
    icon: ShieldCheck,
    title: "Risk managers",
    desc: "Stress-test books against historical analogues that resemble today's regime fingerprint.",
    code: "GET /regime/analogues?n=10",
  },
  {
    icon: Search,
    title: "Researchers",
    desc: "Study how 25 Federal Reserve indicators co-move across decades of US business cycles.",
    code: "GET /regime/history?include_indicators=1",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="Who it's for"
          title="One API. Six different teams."
          description="From portfolio construction to news desks, the same regime signal powers very different workflows."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative surface rounded-2xl p-6 transition-all hover:border-primary/40 hover:shadow-glow"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              <pre className="mt-4 font-mono text-xs surface-2 rounded-lg px-3 py-2 overflow-x-auto scrollbar-thin">
                <code className="text-foreground/80">{c.code}</code>
              </pre>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
