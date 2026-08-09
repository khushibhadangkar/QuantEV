"use client";

import type { RecommendationResponse } from "@/types/api";

interface ResultHeroProps {
  recommendation: RecommendationResponse;
  pipelineRuntime: number;
}

function formatDemand(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh/h`;
  return `${kwh.toFixed(0)} kWh/h`;
}

export function ResultHero({ recommendation, pipelineRuntime }: ResultHeroProps) {
  const { selected_zones, predicted_demand, total_candidate_demand_kwh_h, feasible } = recommendation;

  const selectedTotal = Object.values(predicted_demand).reduce((s, v) => s + v, 0);
  const coveragePct =
    total_candidate_demand_kwh_h > 0
      ? (selectedTotal / total_candidate_demand_kwh_h) * 100
      : 0;

  return (
    <section
      style={{
        padding: "80px 0 60px",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px" }}>
        {/* Eyebrow */}
        <div
          className="anim-fade-up d-0"
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "12px",
            letterSpacing: "0.1em",
            color: "var(--color-ink-4)",
            marginBottom: "20px",
            textTransform: "uppercase",
          }}
        >
          Optimisation complete · {pipelineRuntime.toFixed(1)}s
        </div>

        {/* Main statement */}
        <h2
          className="anim-fade-up d-1"
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
            marginBottom: "12px",
            lineHeight: 1.1,
          }}
        >
          {selected_zones.length} charging location{selected_zones.length !== 1 ? "s" : ""} recommended
        </h2>

        <p
          className="anim-fade-up d-2"
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "17px",
            color: "var(--color-ink-3)",
            marginBottom: "48px",
            maxWidth: "520px",
            lineHeight: 1.6,
          }}
        >
          The quantum optimiser identified these locations as the highest-impact
          sites for new EV charging infrastructure in Shenzhen.
        </p>

        {/* Zone chips — hero display */}
        <div
          className="anim-scale-up d-2"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "52px",
          }}
        >
          {selected_zones.map((zone, i) => {
            const demand = predicted_demand[zone] ?? 0;
            const detail = recommendation.zone_details.find((z) => z.label === zone);
            return (
              <div
                key={zone}
                className={`anim-scale-up d-${i + 2}`}
                style={{
                  background: "var(--color-navy-900)",
                  color: "white",
                  borderRadius: "18px",
                  padding: "20px 28px",
                  minWidth: "160px",
                  boxShadow: "0 8px 32px rgba(10,22,40,0.18)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Subtle inner glow */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(106,151,212,0.2) 0%, transparent 70%)",
                    transform: "translate(20px, -20px)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "36px",
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginBottom: "8px",
                  }}
                >
                  {zone}
                </div>
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "4px",
                  }}
                >
                  {formatDemand(demand)}
                </div>
                {detail && (
                  <div
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {detail.latitude.toFixed(4)}°N
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary stat row */}
        <div
          className="anim-fade-up d-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1px",
            background: "var(--color-border)",
            borderRadius: "16px",
            overflow: "hidden",
            maxWidth: "680px",
            border: "1px solid var(--color-border)",
          }}
        >
          {[
            {
              label: "Stations planned",
              value: String(selected_zones.length),
              sub: "across Shenzhen",
            },
            {
              label: "Predicted demand",
              value: formatDemand(selectedTotal),
              sub: "combined coverage",
            },
            {
              label: "Area coverage",
              value: `${coveragePct.toFixed(0)}%`,
              sub: "of candidate demand",
            },
            {
              label: "Feasible solution",
              value: feasible ? "Yes" : "No",
              sub: "constraint satisfied",
            },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              style={{
                background: "var(--color-white)",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-4)",
                  marginBottom: "6px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "24px",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--color-ink)",
                  lineHeight: 1.1,
                  marginBottom: "3px",
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "12px",
                  color: "var(--color-ink-4)",
                }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
