"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import type { AIDemandResponse } from "@/types/api";

interface DemandGridProps {
  demandPrediction: AIDemandResponse;
  selectedZones: string[];
}

function formatKwh(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(2)} MWh/h`;
  return `${v.toFixed(1)} kWh/h`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 7);
  }
}

export function DemandGrid({
  demandPrediction,
  selectedZones,
}: DemandGridProps) {
  const { predicted_demand, model, test_r2, prediction_time_ms } = demandPrediction;

  // Sort zones by demand descending
  const sortedZones = Object.entries(predicted_demand).sort(
    ([, a], [, b]) => b - a,
  );
  const maxDemand = sortedZones[0]?.[1] ?? 1;

  const selectedSet = new Set(selectedZones);

  return (
    <div className="card-elevated p-6 flex flex-col gap-6 animate-fade-in stagger-2">
      <SectionHeader
        title="AI Demand Prediction"
        subtitle={`${model} · R² ${test_r2 != null ? test_r2.toFixed(3) : "—"} · ${prediction_time_ms.toFixed(0)} ms`}
      />

      <div className="flex flex-col gap-1">
        {sortedZones.map(([zone, demand], i) => {
          const isSelected = selectedSet.has(zone);
          const barWidth = (demand / maxDemand) * 100;
          return (
            <div
              key={zone}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isSelected ? "bg-[var(--color-navy-50)]" : "hover:bg-[var(--color-surface-2)]"}`}
              style={{
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {/* Zone label */}
              <div className="w-7 shrink-0 flex items-center justify-center">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: isSelected
                      ? "var(--color-navy-700)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {zone}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--color-border)" }}
                >
                  <div
                    className="h-full rounded-full origin-left"
                    style={{
                      width: `${barWidth}%`,
                      background: isSelected
                        ? "var(--color-navy-600)"
                        : "var(--color-navy-300)",
                      transform: "scaleX(0)",
                      animation: `bar-grow 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.05}s both`,
                    }}
                  />
                </div>

                {/* Value */}
                <span
                  className="w-24 text-right text-xs font-medium tabular-nums shrink-0"
                  style={{
                    color: isSelected
                      ? "var(--color-navy-700)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  {formatKwh(demand)}
                </span>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--color-navy-600)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Model meta */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t text-[11px]"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-tertiary)",
        }}
      >
        <span>
          Test period{" "}
          {formatDate(demandPrediction.test_split_start)}–
          {formatDate(demandPrediction.test_split_end)}
        </span>
        {demandPrediction.test_mae != null && (
          <span>MAE {demandPrediction.test_mae.toFixed(1)} kWh/h</span>
        )}
      </div>
    </div>
  );
}
