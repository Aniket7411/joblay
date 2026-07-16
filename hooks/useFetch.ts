"use client";

import { useCallback, useState } from "react";
import type { ApiResponse } from "@/types";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>() {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
      setState({ data: null, loading: true, error: null });
      try {
        const res = await fetch(url, options);
        const json = (await res.json()) as ApiResponse<T>;
        if (!res.ok || !json.success) {
          const msg = json.message || "Something went wrong";
          setState({ data: null, loading: false, error: msg });
          return json;
        }
        setState({ data: json.data ?? null, loading: false, error: null });
        return json;
      } catch {
        const msg = "Network error. Please try again.";
        setState({ data: null, loading: false, error: msg });
        return { success: false, message: msg };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
