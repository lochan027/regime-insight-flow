import { useCallback, useEffect, useState } from "react";
import { getCurrentRegime, getRegimeHistory } from "@/lib/api";
import type { CurrentRegimeResponse } from "@/types/api";

export function useCurrentRegime() {
  const [data, setData] = useState<CurrentRegimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsFallback(false);
    try {
      const res = await getCurrentRegime();
      setData(res.data);
    } catch (e: any) {
      try {
        const history = await getRegimeHistory();
        const points = history.data.points;
        const latest = points.at(-1);
        if (!latest) throw e;

        let months = 0;
        for (let i = points.length - 1; i >= 0; i -= 1) {
          if (points[i].regime !== latest.regime) break;
          months += 1;
        }
        const inPlaceIdx = Math.max(points.length - months, 0);
        const inPlaceSince = points[inPlaceIdx]?.date ?? latest.date;
        const asOf = /^\d{4}-\d{2}$/.test(latest.date) ? `${latest.date}-01` : latest.date;
        const inPlaceSinceIso = /^\d{4}-\d{2}$/.test(inPlaceSince) ? `${inPlaceSince}-01` : inPlaceSince;

        setData({
          regime: latest.regime,
          in_place_since: inPlaceSinceIso,
          months_in_regime: months,
          confidence: 0,
          top_assets: [],
          as_of: asOf,
        });
        setIsFallback(true);
      } catch {
        setError(e?.message ?? "Unable to reach API");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, isFallback, refetch: load };
}
