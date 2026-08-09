"use client";

import { CheckCircle2, Atom } from "lucide-react";
import type { RecommendationResponse } from "@/types/api";

interface RecommendationHeroProps {
  recommendation: RecommendationResponse;
  pipelineRuntime: number;
}

function formatEnergy(e: number): string {
  return e.toFixed(3);
}

function formatMethod(method: string): string {
  if (method === "qaoa_aer_simulator") return "QAOA · Aer Simulator";
  if (method === "classical_exhaustive") return "Classical · Exhaustive";
  return method.replace(/_/g, " ");
}

function formatDemand(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh/h`;
  return `${kwh.toFixed(1)} kWh/h`;
}

export function RecommendationHero({
  recommendation,
  pipelineRuntime,
}: RecommendationHeroProps) {
  const {
    selected_zones,
    method,
    qubo_energy,
    feasible,
    matches_qubo_optimum,
    predicted_demand,
    total_candidate_demand_kwh_h,
    zone_details,
  } = recommendation;

  const selectedDemandTotal = Object.values(predicted_demand).reduce(
    (s, v) => s + v,
    0,
  );
  const coveragePct =
    total_candidate_demand_kwh_h > 0
      ? (selectedDemandTotal / total_candidate_demand_kwh_h) * 100
      : 0;

  return (
    <div
      className="relative overflow-hidden rounded-3xl animate-fade-in-up"
      style={{
        background: "var(--color-navy-900)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(74,123,196,0.25) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(46,84,144,0.3) 0%, transparent 50%)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 p-8 sm:p-10">
        {/* Top row */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Atom size={20} style={{ color: "rgba(255,255,255,0.9)" }} strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Recommendation
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {formatMethod(method)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {feasible && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: "rgba(26,158,94,0.18)",
                  color: "#4ade80",
                  border: "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <CheckCircle2 size={11} />
                Feasible
              </span>
            )}
            {matches_qubo_optimum && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: "rgba(74,123,196,0.2)",
                  color: "rgba(179,204,234,1)",
                  border: "1px solid rgba(74,123,196,0.3)",
                }}
              >
                Quantum Optimal
              </span>
            )}
          </div>
        </div>

        {/* Selected zones — hero display */}
        <div className="mb-8">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Recommended zones · {selected_zones.length} stations
          </p>
          <div className="flex flex-wrap gap-3">
            {selected_zones.map((zone, i) => {
              const detail = zone_details.find((z) => z.label === zone);
              const demand = predicted_demand[zone];
              return (
                <div
                  key={zone}
                  className="animate-scale-in flex flex-col gap-1.5 px-5 py-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    animationDelay: `${i * 0.08}s`,
                  }}
                >
                  <span
                    className="text-3xl font-light tracking-tight"
                    style={{ color: "#ffffff", letterSpacing: "-0.03em" }}
                  >
                    {zone}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {formatDemand(demand ?? 0)}
                  </span>
                  {detail && (
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {detail.latitude.toFixed(4)}°N
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 gap-px sm:grid-cols-4 rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {[
            {
              label: "QUBO Energy",
              value: formatEnergy(qubo_energy),
              unit: "",
            },
            {
              label: "Selected Demand",
              value: formatDemand(selectedDemandTotal),
              unit: "",
            },
            {
              label: "Coverage",
              value: `${coveragePct.toFixed(1)}%`,
              unit: "of candidates",
            },
            {
              label: "Runtime",
              value: `${pipelineRuntime.toFixed(1)}s`,
              unit: "total pipeline",
            },
          ].map(({ label, value, unit }) => (
            <div
              key={label}
              className="flex flex-col gap-1 px-5 py-4"
              style={{ background: "rgba(13,26,46,0.4)" }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {label}
              </span>
              <span
                className="text-lg font-semibold tracking-tight"
                style={{ color: "rgba(255,255,255,0.95)" }}
              >
                {value}
              </span>
              {unit && (
                <span
                  className="text-[10px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {unit}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
