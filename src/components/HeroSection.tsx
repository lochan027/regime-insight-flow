import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HeroLiveCard } from "./HeroLiveCard";


const stats = [
  { value: 25, suffix: "", label: "FRED indicators" },
  { value: 1990, suffix: "", label: "History since" },
  { value: 4, suffix: "", label: "Macro regimes" },
  { value: 3, suffix: "", label: "Endpoints" },
];

function AnimatedNumber({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className="tabular-nums">{n.toLocaleString()}</span>;
}

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  return (
    <section id="top" ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden"
    >
      {/* Parallax glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(600px 400px at ${mouse.x}% ${mouse.y}%, hsl(var(--primary) / 0.10), transparent 70%)`,
        }}
      />
      <div aria-hidden className="absolute inset-0 grid-bg opacity-40" />

      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border hairline bg-surface-2/60 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground"
            >
              <span className="live-dot" /> Live API · Updated monthly
            </motion.div>

            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-tight leading-[1.05]">
              {["Know which macro", "regime you're in.", "Act accordingly."].map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={i === 2 ? "text-gradient" : ""}
                >
                  {line}
                </motion.div>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed"
            >
              A machine learning model trained on <span className="text-foreground">25 Federal Reserve indicators</span> classifies
              the current US economy into one of four historical macro regimes — and maps which asset classes
              have performed best in each, going back to 1990.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg" className="shadow-glow">
                <a href="#explorer">
                  <span className="inline-flex items-center gap-2">
                    Try the live API <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#docs">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> View docs
                  </span>
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border hairline bg-hairline"
            >
              {stats.map((s) => (
                <div key={s.label} className="bg-surface-1 p-4 md:p-5">
                  <div className="text-2xl md:text-3xl font-semibold tracking-tight">
                    <AnimatedNumber to={s.value} />{s.suffix}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <HeroLiveCard />
          </div>
        </div>
      </div>
    </section>
  );
}
