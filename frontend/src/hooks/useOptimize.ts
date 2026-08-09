"use client";

import { useState, useCallback } from "react";
import { runOptimize, ApiClientError } from "@/lib/api";
import type { OptimizeResponse, AsyncState } from "@/types/api";

export function useOptimize() {
  const [state, setState] = useState<AsyncState<OptimizeResponse>>({
    status: "idle",
  });

  const run = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await runOptimize({ reps: 1, shots: 2048, seed: 42 });
      console.info(
        "[QuantEV] Optimization complete — recommended zones:",
        data.recommendation.selected_zones,
        `(${data.pipeline_runtime_s.toFixed(1)}s)`,
      );
      setState({ status: "success", data });
    } catch (err) {
      // Always log the full technical error to the console
      if (err instanceof ApiClientError) {
        console.error(
          "[QuantEV] Optimization failed:",
          err.message,
          err.status != null ? `(HTTP ${err.status})` : "",
          err.rawDetail ? `\nRaw detail: ${err.rawDetail}` : "",
        );
        setState({ status: "error", message: err.message });
      } else if (err instanceof Error) {
        console.error("[QuantEV] Unexpected error:", err);
        setState({ status: "error", message: err.message });
      } else {
        console.error("[QuantEV] Unknown error:", err);
        setState({
          status: "error",
          message:
            "An unexpected error occurred. Check the browser console for details.",
        });
      }
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, reset };
}
