import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRegimeHistory } from "@/hooks/useRegimeHistory";
import { getRegimeColor } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

export function TimelineSection() {
  const { data, loading } = useRegimeHistory({ start: "2000-01-01" });

  const { chartData, regimes } = useMemo(() => {
    const points = data?.points ?? [];
    const regimes = Array.from(new Set(points.map((p) => p.regime)));
    return { chartData: points, regimes };
  }, [data]);

  return (
    <section id="timeline" className="relative py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="Monthly history"
          title="Every month classified since 2000"
          description="Each bar is one month. Color shows the model-assigned regime. Height is the growth composite — a blend of GDP, payrolls, and activity indicators."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="surface rounded-2xl p-4 md:p-6"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            {regimes.map((r) => (
              <div key={r} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: getRegimeColor(r) }} />
                {r}
              </div>
            ))}
            {loading && (
              <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Loading history…
              </div>
            )}
          </div>

          <div className="h-[320px] md:h-[420px] w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--hairline))" }}
                  interval={Math.max(0, Math.floor((chartData.length || 1) / 12))}
                  tickFormatter={(d: string) => d.slice(0, 4)}
                />
                <YAxis
                  domain={[-1, 1]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--surface-3) / 0.6)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--hairline))",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "0 12px 40px -12px hsl(0 0% 0% / 0.6)",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value: any, _name, p: any) => [
                    `${Number(value).toFixed(2)}`,
                    p?.payload?.regime,
                  ]}
                />
                <Bar dataKey="growth_composite" radius={[2, 2, 0, 0]} animationDuration={1200} animationEasing="ease-out">
                  {chartData.map((p, i) => (
                    <Cell key={i} fill={getRegimeColor(p.regime)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
