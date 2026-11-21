"use client";

/* eslint-disable react-hooks/set-state-in-effect -- fetching data on mount is a valid external-system subscription. */

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiFetch, errorMessage } from "@/lib/api/client";

type UseApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number | null;
  /** True only while the current path has no data yet (first load or filter change). */
  loading: boolean;
  /** True while revalidating a path that already has data. Keep the UI stable. */
  refreshing: boolean;
  refetch: () => Promise<void>;
};

/**
 * Hook data-fetching ringan tanpa dependency tambahan.
 * `path = null` menunda request (mis. menunggu parameter).
 */
export function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const loadedPath = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!path) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const id = ++requestId.current;
    const isRefresh = loadedPath.current === path;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setRefreshing(false);
    }
    setError(null);

    try {
      const result = await apiFetch<T>(path);
      if (id !== requestId.current) return;
      setData(result);
      setStatus(200);
      loadedPath.current = path;
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(errorMessage(cause));
      setStatus(cause instanceof ApiError ? cause.status : null);
      setData(null);
      loadedPath.current = null;
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, status, loading, refreshing, refetch: load };
}
