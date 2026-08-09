"use client";

import type { RecommendationResponse, AIDemandResponse } from "@/types/api";

interface WhySectionProps {
  recommendation: RecommendationResponse;
  demandPrediction: AIDemandResponse;
}

function formatDemand(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh/h`;
  return `${kwh.toFixed(0)} kWh/h`;
}

export function WhySection({ recommendation, demandPrediction }: WhySectionProps) {
  const { zone_details, selected_zones } = recommendation;
  const { predicted_demand } = demandPrediction;
  const selectedSet = new Set(selected_zones);

  // Sort all zones by demand
  const sortedZones = [...zone_details].sort(
    (a, b) => b.predicted_demand_kwh_h - a.predicted_demand_kwh_h
  );
  const maxDemand = sortedZones[0]?.predicted_demand_kwh_h ?? 1;

  return (
    <section
      style={{
        padding: "100px 0",
        background: "var(--color-white)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "0 32px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "start",
        }}
        className="responsive-grid"
      >
        {/* Left — Plain-English explanation */}
        <div className="anim-fade-up d-0">
          <p
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-4)",
              marginBottom: "20px",
            }}
          >
            The reasoning
          </p>
          <h2
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
              lineHeight: 1.15,
              marginBottom: "28px",
            }}
          >
            Why these
            <br />
            <em>locations?</em>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                num: "01",
                title: "Where demand is highest",
                body: `We analysed ${Object.keys(predicted_demand).length} candidate zones across Shenzhen, measuring predicted hourly electricity demand from EV charging activity. The selected zones consistently show the strongest demand signals.`,
              },
              {
                num: "02",
                title: "Where coverage reaches furthest",
                body:
                  "Each station covers not just its own zone, but also nearby areas within 3 km. The optimiser identified the placement that maximises total covered demand across the network.",
              },
              {
                num: "03",
                title: "What makes it quantum",
                body:
                  "With 8 candidate zones and 3 stations to place, there are 56 possible combinations. We formulated this as a quantum optimisation problem and solved it using QAOA — a hybrid algorithm designed for this class of decision problem.",
              },
            ].map(({ num, title, body }, i) => (
              <div
                key={num}
                className={`anim-fade-up d-${i + 1}`}
                style={{ display: "flex", gap: "20px" }}
              >
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "13px",
                    color: "var(--color-ink-4)",
                    minWidth: "28px",
                    paddingTop: "3px",
                  }}
                >
                  {num}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "16px",
                      color: "var(--color-ink)",
                      marginBottom: "6px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "14px",
                      color: "var(--color-ink-3)",
                      lineHeight: 1.7,
                    }}
                  >
                    {body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Demand visualisation */}
        <div className="anim-fade-up d-2">
          <p
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-4)",
              marginBottom: "20px",
            }}
          >
            Demand by zone
          </p>
          <h3
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "22px",
              fontWeight: 400,
              letterSpacing: "-0.015em",
              color: "var(--color-ink)",
              marginBottom: "32px",
            }}
          >
            Predicted hourly demand
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {sortedZones.map((zone, i) => {
              const isSelected = selectedSet.has(zone.label);
              const barPct = (zone.predicted_demand_kwh_h / maxDemand) * 100;

              return (
                <div
                  key={zone.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 0",
                    borderBottom:
                      i < sortedZones.length - 1
                        ? "1px solid var(--color-border-subtle)"
                        : "none",
                  }}
                >
                  {/* Zone label */}
                  <div
                    style={{
                      width: "32px",
                      fontFamily: "Times New Roman, serif",
                      fontSize: "14px",
                      fontWeight: isSelected ? 400 : 400,
                      color: isSelected
                        ? "var(--color-navy-800)"
                        : "var(--color-ink-3)",
                      flexShrink: 0,
                    }}
                  >
                    {zone.label}
                  </div>

                  {/* Bar track */}
                  <div style={{ flex: 1, position: "relative" }}>
                    <div
                      style={{
                        height: "4px",
                        background: "var(--color-border)",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${barPct}%`,
                          borderRadius: "99px",
                          background: isSelected
                            ? "var(--color-navy-800)"
                            : "var(--color-navy-200)",
                          transformOrigin: "left",
                          animation: `bar-fill 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.06}s both`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      width: "88px",
                      textAlign: "right",
                      fontFamily: "Times New Roman, serif",
                      fontSize: "13px",
                      color: isSelected
                        ? "var(--color-navy-800)"
                        : "var(--color-ink-3)",
                      flexShrink: 0,
                    }}
                  >
                    {formatDemand(zone.predicted_demand_kwh_h)}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--color-navy-800)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "20px",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              color: "var(--color-ink-4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "3px",
                  borderRadius: "99px",
                  background: "var(--color-navy-800)",
                }}
              />
              Recommended
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "3px",
                  borderRadius: "99px",
                  background: "var(--color-navy-200)",
                }}
              />
              Not selected
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 60px !important;
          }
        }
      `}</style>
    </section>
  );
}
