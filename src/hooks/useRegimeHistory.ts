import { useEffect, useState } from "react";
import { getRegimeHistory, type HistoryParams } from "@/lib/api";
import type { RegimeHistoryResponse } from "@/types/api";

export function useRegimeHistory(params: HistoryParams = {}) {
  const [data, setData] = useState<RegimeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRegimeHistory(params)
      .then((r) => { if (active) setData(r.data); })
      .catch((e) => { if (active) setError(e?.message ?? "error"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.start, params.end, params.include_indicators]);

  return { data, loading, error };
}
