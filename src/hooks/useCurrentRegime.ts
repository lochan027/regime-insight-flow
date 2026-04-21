import { useCallback, useEffect, useState } from "react";
import { getCurrentRegime } from "@/lib/api";
import type { CurrentRegimeResponse } from "@/types/api";

export function useCurrentRegime() {
  const [data, setData] = useState<CurrentRegimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCurrentRegime();
      setData(res.data);
    } catch (e: any) {
      setError(e?.message ?? "Unable to reach API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, refetch: load };
}
