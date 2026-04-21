import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#explorer", label: "Explorer" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#docs", label: "API docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-3"
      }`}
    >
      <div className="container">
        <div
          className={`glass flex items-center justify-between rounded-2xl px-4 md:px-5 transition-all ${
            scrolled ? "py-2 shadow-card" : "py-3"
          }`}
        >
          <a href="#top" className="flex items-center gap-2.5 group">
            <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow">
              <Activity className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight">Macro Regime Detector</span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="live-dot" /> Live
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="#docs">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Docs
                </span>
              </a>
            </Button>
            <Button asChild size="sm" className="shadow-glow">
              <a href="#explorer">Try the API</a>
            </Button>
          </div>

          <button
            className="md:hidden grid h-9 w-9 place-items-center rounded-lg surface-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden mt-2 glass rounded-2xl p-3 flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                 className="rounded-lg px-3 py-2 text-sm hover:bg-surface-2">{l.label}</a>
            ))}
            <Button asChild size="sm" className="mt-1">
              <a href="#explorer" onClick={() => setOpen(false)}>Try the API</a>
            </Button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
