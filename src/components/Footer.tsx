import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t hairline mt-12">
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Activity className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-semibold tracking-tight">Macro Regime Detector</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              A live API for classifying the US macro regime from 25 Federal Reserve indicators.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#explorer" className="text-foreground/80 hover:text-foreground">API explorer</a></li>
              <li><a href="#use-cases" className="text-foreground/80 hover:text-foreground">Use cases</a></li>
              <li><a href="#docs" className="text-foreground/80 hover:text-foreground">API docs</a></li>
              <li><a href="#top" className="text-foreground/80 hover:text-foreground">Home</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Data</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Source: Federal Reserve (FRED)</li>
              <li>History since 1990</li>
              <li>Updated monthly</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Macro Regime Detector. All rights reserved.</div>
          <div className="inline-flex items-center gap-2">
            <span className="live-dot" /> API operational
          </div>
        </div>
      </div>
    </footer>
  );
}
