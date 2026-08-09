"use client";

import { useOptimize } from "@/hooks/useOptimize";
import { Navbar } from "@/components/dashboard/Navbar";
import { IdleState } from "@/components/dashboard/IdleState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RecommendationHero } from "@/components/dashboard/RecommendationHero";
import { DemandGrid } from "@/components/dashboard/DemandGrid";
import { ZoneMap } from "@/components/dashboard/ZoneMap";
import { QUBOPanel } from "@/components/dashboard/QUBOPanel";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Activity,
  Cpu,
  Radio,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { state, run, reset } = useOptimize();

  const isLoading = state.status === "loading";
  const hasResult = state.status === "success";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-canvas)" }}
    >
      <Navbar
        onRun={() => run()}
        onReset={reset}
        isLoading={isLoading}
        hasResult={hasResult}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        {/* ── Idle ─────────────────────────────────────────────── */}
        {state.status === "idle" && (
          <IdleState onRun={() => run()} />
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {state.status === "loading" && <LoadingState />}

        {/* ── Error ─────────────────────────────────────────────── */}
        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={() => run()} />
        )}

        {/* ── Results ───────────────────────────────────────────── */}
        {state.status === "success" && (() => {
          const { data } = state;
          const { recommendation, demand_prediction, qubo, classical, qaoa, pipeline_runtime_s } = data;

          return (
            <div className="flex flex-col gap-6">
              {/* Page title */}
              <div className="animate-fade-in flex flex-wrap items-baseline gap-3">
                <h1
                  className="text-2xl font-light tracking-tight"
                  style={{
                    color: "var(--color-text-primary)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Optimization complete
                </h1>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {pipeline_runtime_s.toFixed(1)} s total
                </span>
              </div>

              {/* ── Hero recommendation ──────────────────────────── */}
              <RecommendationHero
                recommendation={recommendation}
                pipelineRuntime={pipeline_runtime_s}
              />

              {/* ── Summary metrics row ──────────────────────────── */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MetricCard
                  label="Qubits"
                  value={qubo.n_qubits}
                  sub="QUBO problem size"
                  icon={<Cpu size={13} />}
                  animClass="animate-fade-in stagger-1"
                />
                <MetricCard
                  label="Circuit depth"
                  value={qaoa.circuit_depth}
                  sub={`reps p=${qaoa.reps}`}
                  icon={<Radio size={13} />}
                  animClass="animate-fade-in stagger-2"
                />
                <MetricCard
                  label="AI model R²"
                  value={
                    demand_prediction.test_r2 != null
                      ? demand_prediction.test_r2.toFixed(3)
                      : "—"
                  }
                  sub={demand_prediction.model.replace("Regressor", "")}
                  icon={<Activity size={13} />}
                  animClass="animate-fade-in stagger-3"
                />
                <MetricCard
                  label="QAOA runtime"
                  value={`${qaoa.runtime_s.toFixed(1)} s`}
                  sub={`${qaoa.shots.toLocaleString()} shots`}
                  icon={<Clock size={13} />}
                  animClass="animate-fade-in stagger-4"
                />
              </div>

              {/* ── Two-column content ───────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DemandGrid
                  demandPrediction={demand_prediction}
                  selectedZones={recommendation.selected_zones}
                />
                <ZoneMap zoneDetails={recommendation.zone_details} />
              </div>

              {/* ── QUBO / Solver details ─────────────────────────── */}
              <QUBOPanel qubo={qubo} classical={classical} qaoa={qaoa} />

              {/* ── Top-10 QAOA samples ───────────────────────────── */}
              {qaoa.top10_samples.length > 0 && (
                <div className="card-elevated p-6 flex flex-col gap-4 animate-fade-in stagger-5">
                  <div>
                    <h2
                      className="text-base font-semibold tracking-tight"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      QAOA sample distribution
                    </h2>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      Top {qaoa.top10_samples.length} states by probability
                    </p>
                  </div>

                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr
                          style={{ borderBottom: "1px solid var(--color-border)" }}
                        >
                          {[
                            "Bitstring",
                            "Zones",
                            "Probability",
                            "Energy",
                            "k",
                            "Feasible",
                          ].map((h) => (
                            <th
                              key={h}
                              className="pb-2 pr-4 text-left font-semibold uppercase tracking-wider text-[10px]"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {qaoa.top10_samples.map((s, i) => (
                          <tr
                            key={i}
                            className="transition-colors duration-100 hover:bg-[var(--color-surface-2)]"
                            style={{
                              borderBottom: "1px solid var(--color-border)",
                            }}
                          >
                            <td
                              className="py-2.5 pr-4 font-mono text-[11px]"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {s.bitstring}
                            </td>
                            <td className="py-2.5 pr-4">
                              <div className="flex flex-wrap gap-1">
                                {s.zones.map((z) => (
                                  <span
                                    key={z}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{
                                      background: "var(--color-navy-100)",
                                      color: "var(--color-navy-700)",
                                    }}
                                  >
                                    {z}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td
                              className="py-2.5 pr-4 tabular-nums font-medium"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {(s.probability * 100).toFixed(2)}%
                            </td>
                            <td
                              className="py-2.5 pr-4 tabular-nums font-mono text-[11px]"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {s.qubo_energy.toFixed(3)}
                            </td>
                            <td
                              className="py-2.5 pr-4 tabular-nums"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {s.n_stations}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className="inline-block w-4 h-4 rounded-full text-center text-[9px] leading-4 font-bold"
                                style={{
                                  background: s.feasible
                                    ? "var(--color-success-bg)"
                                    : "var(--color-error-bg)",
                                  color: s.feasible
                                    ? "var(--color-success)"
                                    : "var(--color-error)",
                                }}
                              >
                                {s.feasible ? "✓" : "✗"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Footer ────────────────────────────────────────── */}
              <footer
                className="pt-2 pb-6 text-center text-[11px]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                QuantEV · AI demand prediction + QUBO + QAOA · Aer Simulator ·{" "}
                {new Date().getFullYear()}
              </footer>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
