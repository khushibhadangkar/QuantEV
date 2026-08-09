"use client";

import { useState, useCallback } from "react";
import { runOptimize } from "@/lib/api";
import type { OptimizeRequest, OptimizeResponse, AsyncState } from "@/types/api";

export function useOptimize() {
  const [state, setState] = useState<AsyncState<OptimizeResponse>>({
    status: "idle",
  });

  const run = useCallback(async (params: OptimizeRequest = {}) => {
    setState({ status: "loading" });
    try {
      const data = await runOptimize(params);
      setState({ status: "success", data });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, run, reset };
}
