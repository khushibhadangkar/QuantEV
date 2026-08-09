/**
 * API client for the QuantEV FastAPI backend.
 * Base URL: http://localhost:8000
 */

import type { OptimizeRequest, OptimizeResponse } from "@/types/api";

const BASE_URL = "http://localhost:8000";

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
  } catch {
    throw new ApiClientError(
      "Cannot reach the QuantEV backend. Make sure the server is running on port 8000.",
    );
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/optimize
 * Run the full AI → QUBO → QAOA pipeline.
 */
export async function runOptimize(
  params: OptimizeRequest = {},
): Promise<OptimizeResponse> {
  return request<OptimizeResponse>("/api/v1/optimize", {
    method: "POST",
    body: JSON.stringify({
      reps: params.reps ?? 1,
      shots: params.shots ?? 2048,
      seed: params.seed ?? 42,
    }),
  });
}

/**
 * GET /api/v1/health
 */
export async function getHealth(): Promise<{ status: string; service: string }> {
  return request("/api/v1/health");
}

export { ApiClientError };
