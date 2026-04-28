import { useCallback, useEffect, useState } from "react";
import { getRegimeInsight } from "@/lib/api";
import type { RegimeInsightResponse } from "@/types/api";

export function useRegimeInsight() {
  const [data, setData] = useState<RegimeInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRegimeInsight();
      setData(res.data);
    } catch (e: any) {
      setError(e?.message ?? "Unable to load insight");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
