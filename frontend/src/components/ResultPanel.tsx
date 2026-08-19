"use client";

import { useState } from "react";
import type { OptimizeResponse, PlanningScenario } from "@/types/api";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDemand(kwh: number): string {
  if (kwh >= 1000) return `${Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kwh / 1000)} MWh/h`;
  return `${Intl.NumberFormat("en-US").format(Math.round(kwh))} kWh/h`;
}

function formatDist(km: number): string {
  return km < 1 ? `${Intl.NumberFormat("en-US").format(Math.round(km * 1000))} m` : `${km.toFixed(1)} km`;
}

interface ResultPanelProps {
  data: OptimizeResponse;
  userLat: number;
  userLng: number;
  locationName: string;
  onReset: () => void;
  stationCount: number;
  scenario: PlanningScenario;
  lastRunParams: { stationCount: number; scenario: PlanningScenario } | null;
  onSearch: () => void;
}

const SCENARIO_LABELS: Record<string, string> = {
  all_hours: "24h Baseline",
  morning_peak: "Morning Rush",
  afternoon: "Afternoon",
  overnight: "Overnight Fleet",
  weekday: "Weekday",
  weekend: "Weekend",
};

export function ResultPanel({
  data,
  userLat,
  userLng,
  locationName,
  onReset,
  stationCount,
  scenario,
  lastRunParams,
  onSearch,
}: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"sites" | "compare" | "diagnostics">("sites");

  const isStale = lastRunParams && (lastRunParams.stationCount !== stationCount || lastRunParams.scenario !== scenario);

  const { recommendation, qaoa, classical, qubo, pipeline_runtime_s } = data;
  const { zone_details, selected_zones } = recommendation;
  const selectedSet = new Set(selected_zones);

  const scenarioLabel = SCENARIO_LABELS[recommendation.scenario || data.demand_prediction.scenario || "all_hours"] || "24h Baseline";
  const k = selected_zones.length;

  const sortedZones = [...zone_details].sort((a, b) => {
    if (selectedSet.has(a.label) && !selectedSet.has(b.label)) return -1;
    if (!selectedSet.has(a.label) && selectedSet.has(b.label)) return 1;
    return b.qubo_c_value - a.qubo_c_value;
  });

  const tabStyle = (t: typeof activeTab) => ({
    flex: 1,
    padding: "8px 0",
    border: "none",
    background: activeTab === t ? "var(--color-navy-900)" : "transparent",
    color: activeTab === t ? "white" : "var(--color-ink-3)",
    fontFamily: "Times New Roman, serif",
    fontSize: "12px",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.15s ease",
    letterSpacing: "0.01em",
  });

  return (
    <div className="anim-slide-up" style={{ display: "flex", flexDirection: "column" }}>
      {isStale && (
        <div style={{ padding: "12px 22px", background: "var(--color-warning-bg)", borderBottom: "1px solid rgba(220, 160, 0, 0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ fontFamily: "Times New Roman, serif", fontSize: "13px", color: "var(--color-warning-text)", lineHeight: 1.2 }}>
              Controls changed. <br/>These results are for <strong className="numeric">{lastRunParams?.stationCount}</strong> <strong>stations</strong> ({SCENARIO_LABELS[lastRunParams?.scenario || "all_hours"]}).
            </span>
          </div>
          <button
            onClick={onSearch}
            style={{
              padding: "6px 12px", borderRadius: "6px", border: "none",
              background: "var(--color-warning)", color: "white",
              fontFamily: "Times New Roman, serif", fontSize: "12px",
              cursor: "pointer", transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Update
          </button>
        </div>
      )}
      <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid var(--color-border-subtle)", opacity: isStale ? 0.5 : 1 }}>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "3px" }}>
          {locationName} · {scenarioLabel}
        </div>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "18px", letterSpacing: "-0.015em", color: "var(--color-ink)", lineHeight: 1.2 }}>
          {k} recommended sites
        </div>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-4)", marginTop: "2px" }}>
          Target constraint (K): {k} stations
        </div>
      </div>

      <div style={{ padding: "8px 22px", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--color-grey-50)", borderRadius: "10px", padding: "3px" }}>
          {(["sites", "compare", "diagnostics"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
              {t === "sites" ? "Sites" : t === "compare" ? "Solvers" : "Quantum"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "sites" && (
        <div>
          {sortedZones.map((zone, idx) => {
            const isSelected = selectedSet.has(zone.label);
            const dist = haversine(userLat, userLng, zone.latitude, zone.longitude);

            return (
              <div
                key={zone.label}
                className={`anim-fade-in d-${idx}`}
                style={{
                  padding: "14px 22px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  background: isSelected ? "var(--color-navy-50)" : "transparent",
                  opacity: isSelected ? 1 : 0.6,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: isSelected ? "var(--color-navy-900)" : "var(--color-grey-100)",
                      border: isSelected ? "none" : "1px solid var(--color-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: isSelected ? "white" : "var(--color-ink-4)" }}>
                        {isSelected ? "✓" : "-"}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "16px", color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
                        {zone.name_primary || `Site ${zone.label}`}
                      </div>
                      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)" }}>
                        {zone.name_secondary ? `${zone.name_secondary} · ` : ""}<span className="numeric">{zone.label}</span> · <span className="numeric">{formatDist(dist)}</span> away
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div>
                    <div style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-ink-4)", marginBottom: "1px" }}>Predicted Demand</div>
                    <div className="numeric" style={{ fontSize: "13px", color: "var(--color-ink-2)" }}>{formatDemand(zone.predicted_demand_kwh_h)}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-ink-4)", marginBottom: "1px" }}>Objective Score (c_j)</div>
                    <div className="numeric" style={{ fontSize: "13px", color: "var(--color-ink-2)" }}>{zone.qubo_c_value.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "compare" && (
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-ink-4)" }}>
              Solver Agreement
            </div>
            {qaoa.matches_qubo_optimum ? (
               <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "9px 12px", borderRadius: "8px",
                background: "var(--color-positive-bg)", border: "1px solid rgba(15,122,74,0.15)",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--color-positive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-positive)" }}>
                  QAOA found the exact global QUBO optimum
                </span>
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "9px 12px", borderRadius: "8px",
                background: "var(--color-grey-50)", border: "1px solid var(--color-border)",
              }}>
                <span style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-3)" }}>
                  QAOA found a near-optimal solution
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ padding: "12px", borderRadius: "10px", background: "var(--color-navy-900)", color: "white" }}>
              <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>QAOA</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Selected Zones</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{qaoa.selected_zones.join(", ") || "None"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Objective Value</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{qaoa.objective_value.toFixed(4)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>QUBO Energy</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{qaoa.qubo_energy.toFixed(4)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Feasibility</div>
                  <div style={{ fontSize: "14px" }}>{qaoa.feasible ? "Valid" : "Invalid"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Runtime</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{qaoa.runtime_s.toFixed(2)} s</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "10px", background: "var(--color-grey-50)", border: "1px solid var(--color-border)", color: "var(--color-ink)" }}>
              <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "8px" }}>Classical</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-ink-4)" }}>Selected Zones</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{classical.selected_zones.join(", ") || "None"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-ink-4)" }}>Objective Value</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{classical.objective_value.toFixed(4)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-ink-4)" }}>QUBO Energy</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{classical.qubo_energy.toFixed(4)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-ink-4)" }}>Feasibility</div>
                  <div style={{ fontSize: "14px" }}>{classical.feasible ? "Valid" : "Invalid"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-ink-4)" }}>Runtime</div>
                  <div className="numeric" style={{ fontSize: "14px" }}>{(classical.runtime_s * 1000).toFixed(1)} ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "diagnostics" && (
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { label: "Circuit Depth", value: qaoa.circuit_depth },
            { label: "Ansatz Depth (p)", value: qaoa.reps },
            { label: "Simulator Shots", value: Intl.NumberFormat("en-US").format(qaoa.shots) },
            { label: "Success Probability", value: qaoa.success_probability ? `${(qaoa.success_probability * 100).toFixed(2)}%` : "N/A" },
            { label: "Energy Gap", value: qaoa.energy_gap.toFixed(4) },
            { label: "QUBO Qubits", value: qubo.n_qubits },
            { label: "Penalty Lambda", value: qubo.lambda.toFixed(1) },
            { label: "Total Pipeline Time", value: `${pipeline_runtime_s.toFixed(2)} s` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-3)" }}>{label}</div>
              <div className="numeric" style={{ fontSize: "14px", color: "var(--color-ink)", textAlign: "right" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 22px" }}>
        <button
          onClick={onReset}
          style={{
            width: "100%", padding: "10px", borderRadius: "10px",
            border: "1px solid var(--color-border)", background: "transparent",
            fontFamily: "Times New Roman, serif", fontSize: "13px", color: "var(--color-ink-3)",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-navy-300)";
            e.currentTarget.style.color = "var(--color-ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-ink-3)";
          }}
        >
          New analysis
        </button>
      </div>
    </div>
  );
}
