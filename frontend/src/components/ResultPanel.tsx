"use client";

import { useState } from "react";
import type { RecommendationResponse, OptimizeResponse } from "@/types/api";

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
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh/h`;
  return `${Math.round(kwh)} kWh/h`;
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function siteScore(demand: number, maxDemand: number, quboCValue: number): number {
  const demandScore = (demand / maxDemand) * 60;
  const coverageScore = Math.min(quboCValue / 40, 1) * 40;
  return Math.round(demandScore + coverageScore);
}



interface ResultPanelProps {
  data: OptimizeResponse;
  userLat: number;
  userLng: number;
  locationName: string;
  onReset: () => void;
  onScenarioChange?: (k: number) => void;
  activeScenario?: number;
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
  onScenarioChange,
  activeScenario,
}: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"sites" | "impact" | "compare">("sites");
  const { recommendation, qaoa, classical } = data;
  const { zone_details, selected_zones, total_candidate_demand_kwh_h } = recommendation;
  const selectedSet = new Set(selected_zones);

  const scenarioLabel = SCENARIO_LABELS[recommendation.scenario || data.demand_prediction.scenario || "all_hours"] || "24h Baseline";

  const maxDemand = Math.max(...zone_details.map((z) => z.predicted_demand_kwh_h), 1);

  const selectedZones = zone_details
    .filter((z) => selectedSet.has(z.label))
    .sort((a, b) => b.predicted_demand_kwh_h - a.predicted_demand_kwh_h);

  const coveredDemand = selectedZones.reduce((s, z) => s + z.predicted_demand_kwh_h, 0);
  const coveragePct = total_candidate_demand_kwh_h > 0
    ? (coveredDemand / total_candidate_demand_kwh_h) * 100 : 0;

  const coverageImprovement = coveragePct;

  const k = selected_zones.length;

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
      {/* Header */}
      <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "3px" }}>
          {locationName} · {scenarioLabel}
        </div>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "18px", letterSpacing: "-0.015em", color: "var(--color-ink)", lineHeight: 1.2 }}>
          {k} recommended sites
        </div>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-4)", marginTop: "2px" }}>
          {coveragePct.toFixed(0)}% demand coverage · {k} stations
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "8px 22px", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--color-grey-50)", borderRadius: "10px", padding: "3px" }}>
          {(["sites", "impact", "compare"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
              {t === "sites" ? "Sites" : t === "impact" ? "Impact" : "Compare"}
            </button>
          ))}
        </div>
      </div>

      {/* ── SITES TAB ──────────────────────────────────────── */}
      {activeTab === "sites" && (
        <div>
          {selectedZones.map((zone, idx) => {
            const dist = haversine(userLat, userLng, zone.latitude, zone.longitude);
            const score = siteScore(zone.predicted_demand_kwh_h, maxDemand, zone.qubo_c_value);

            return (
              <div
                key={zone.label}
                className={`anim-fade-in d-${idx}`}
                style={{
                  padding: "14px 22px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  background: idx === 0 ? "var(--color-navy-50)" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Rank marker */}
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: idx === 0 ? "var(--color-navy-900)" : "var(--color-navy-100)",
                      border: idx === 0 ? "none" : "1px solid var(--color-navy-200)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: idx === 0 ? "white" : "var(--color-navy-700)" }}>
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "16px", color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
                        Site {zone.label}
                      </div>
                      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)" }}>
                        {zone.latitude.toFixed(4)}°N · {formatDist(dist)} from area
                      </div>
                    </div>
                  </div>
                  {/* Score badge */}
                  <div style={{
                    padding: "3px 8px", borderRadius: "6px",
                    background: score >= 80 ? "var(--color-navy-900)" : score >= 60 ? "var(--color-navy-100)" : "var(--color-grey-100)",
                    border: score >= 80 ? "none" : `1px solid ${score >= 60 ? "var(--color-navy-200)" : "var(--color-border)"}`,
                  }}>
                    <span style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", fontWeight: 600, color: score >= 80 ? "white" : score >= 60 ? "var(--color-navy-700)" : "var(--color-ink-3)" }}>
                      {score}
                    </span>
                    <span style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: score >= 80 ? "rgba(255,255,255,0.7)" : "var(--color-ink-4)", marginLeft: "2px" }}>
                      /100
                    </span>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ display: "flex", gap: "16px" }}>
                  {[
                    { label: "Demand", value: formatDemand(zone.predicted_demand_kwh_h) },
                    { label: "QUBO", value: zone.qubo_c_value.toFixed(2) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-ink-4)", marginBottom: "1px" }}>{label}</div>
                      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "13px", color: "var(--color-ink-2)" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Demand bar */}
                <div style={{ marginTop: "8px", height: "3px", background: "var(--color-border)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    background: idx === 0 ? "var(--color-navy-800)" : "var(--color-navy-300)",
                    width: `${(zone.predicted_demand_kwh_h / maxDemand) * 100}%`,
                    transformOrigin: "left",
                    animation: `bar-fill 0.7s cubic-bezier(0.22,1,0.36,1) ${idx * 0.1 + 0.2}s both`,
                  }} />
                </div>
              </div>
            );
          })}

          {/* View on map CTA */}
          {selectedZones[0] && (
            <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedZones[0].latitude},${selectedZones[0].longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", width: "100%", padding: "11px",
                  borderRadius: "10px", background: "var(--color-navy-900)",
                  color: "white", textAlign: "center", textDecoration: "none",
                  fontFamily: "Times New Roman, serif", fontSize: "14px",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                View top site on map →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── IMPACT TAB ─────────────────────────────────────── */}
      {activeTab === "impact" && (
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Coverage improvement */}
          <div>
            <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "10px" }}>
              Coverage improvement
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Before", value: "0%", sub: "0 stations", dim: true },
                { label: "After", value: `${coveragePct.toFixed(0)}%`, sub: `${k} stations`, dim: false },
              ].map(({ label, value, sub, dim }) => (
                <div key={label} style={{
                  padding: "12px 14px", borderRadius: "10px",
                  background: dim ? "var(--color-grey-50)" : "var(--color-navy-900)",
                  border: dim ? "1px solid var(--color-border)" : "none",
                }}>
                  <div style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: dim ? "var(--color-ink-4)" : "rgba(255,255,255,0.5)", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: "Times New Roman, serif", fontSize: "26px", letterSpacing: "-0.025em", color: dim ? "var(--color-ink-3)" : "white", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: dim ? "var(--color-ink-4)" : "rgba(255,255,255,0.5)", marginTop: "2px" }}>{sub}</div>
                </div>
              ))}
            </div>
            {/* Delta bar */}
            <div style={{ marginTop: "10px", height: "4px", background: "var(--color-border)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{
                height: "100%", background: "var(--color-navy-700)", borderRadius: "99px",
                width: `${coveragePct}%`,
                transformOrigin: "left", animation: "bar-fill 1s cubic-bezier(0.22,1,0.36,1) 0.3s both",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-ink-4)" }}>0%</span>
              <span style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-navy-600)", fontStyle: "italic" }}>
                +{coverageImprovement.toFixed(1)}% improvement
              </span>
              <span style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-ink-4)" }}>100%</span>
            </div>
          </div>

          {/* Network stats */}
          <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "14px" }}>
            <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "10px" }}>
              Network metrics
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "Covered demand", value: formatDemand(coveredDemand), sub: `of ${formatDemand(total_candidate_demand_kwh_h)} total` },
                { label: "Stations deployed", value: `${k}`, sub: `of 8 candidate sites` },
                { label: "Optimisation method", value: "QAOA", sub: qaoa.matches_qubo_optimum ? "Global optimum found" : "Near-optimal solution" },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <div>
                    <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-3)" }}>{label}</div>
                    <div style={{ fontFamily: "Times New Roman, serif", fontSize: "10px", color: "var(--color-ink-4)" }}>{sub}</div>
                  </div>
                  <div style={{ fontFamily: "Times New Roman, serif", fontSize: "15px", color: "var(--color-ink)", textAlign: "right" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimum badge */}
          {qaoa.matches_qubo_optimum && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 12px", borderRadius: "8px",
              background: "var(--color-positive-bg)", border: "1px solid rgba(15,122,74,0.15)",
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="var(--color-positive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-positive)" }}>
                QAOA found the provably optimal placement
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── COMPARE TAB ────────────────────────────────────── */}
      {activeTab === "compare" && (
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-3)", lineHeight: 1.5, marginBottom: "4px" }}>
            Compare different station counts. Select a scenario to visualise it on the map.
          </div>

          {[2, 3, 4, 5].map((n) => {
            const isActive = activeScenario === n || (!activeScenario && n === k);
            const estCoverage = Math.min(n * (coveragePct / k), 100);

            return (
              <button
                key={n}
                onClick={() => onScenarioChange?.(n)}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: "10px",
                  border: isActive ? "1.5px solid var(--color-navy-700)" : "1px solid var(--color-border)",
                  background: isActive ? "var(--color-navy-50)" : "transparent",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = "var(--color-navy-300)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "Times New Roman, serif", fontSize: "15px", color: "var(--color-ink)" }}>
                    {n} station{n !== 1 ? "s" : ""}
                    {n === k && (
                      <span style={{ marginLeft: "6px", fontSize: "10px", background: "var(--color-navy-900)", color: "white", padding: "1px 6px", borderRadius: "4px", letterSpacing: "0.04em" }}>
                        current
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ height: "3px", background: "var(--color-border)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: isActive ? "var(--color-navy-700)" : "var(--color-navy-200)", borderRadius: "99px",
                    width: `${estCoverage}%`,
                    transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
                  }} />
                </div>
                <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)", marginTop: "4px" }}>
                  ~{estCoverage.toFixed(0)}% estimated coverage
                </div>
              </button>
            );
          })}

          <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)", lineHeight: 1.5, borderTop: "1px solid var(--color-border-subtle)", paddingTop: "10px" }}>
            Coverage estimates for non-current scenarios are proportional approximations.
            Run a new analysis to get an exact QAOA-optimised result for a different station count.
          </div>
        </div>
      )}

      {/* New analysis */}
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
