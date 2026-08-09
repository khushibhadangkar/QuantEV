"use client";

import type { RecommendationResponse } from "@/types/api";

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

function formatDemand(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh/h`;
  return `${Math.round(kwh)} kWh/h`;
}

function qualityLabel(kwh: number, maxKwh: number): { label: string; color: string } {
  const ratio = maxKwh > 0 ? kwh / maxKwh : 0;
  if (ratio >= 0.7) return { label: "Very high activity", color: "var(--color-positive)" };
  if (ratio >= 0.35) return { label: "Good activity", color: "#6b8f3a" };
  return { label: "Moderate activity", color: "var(--color-ink-3)" };
}

interface ResultPanelProps {
  recommendation: RecommendationResponse;
  userLat: number;
  userLng: number;
  locationName: string;
  onReset: () => void;
}

export function ResultPanel({
  recommendation,
  userLat,
  userLng,
  locationName,
  onReset,
}: ResultPanelProps) {
  const { zone_details, selected_zones, predicted_demand } = recommendation;
  const selectedSet = new Set(selected_zones);

  // Sort: selected first, then by demand
  const sortedZones = [...zone_details].sort((a, b) => {
    if (a.selected && !b.selected) return -1;
    if (!a.selected && b.selected) return 1;
    return b.predicted_demand_kwh_h - a.predicted_demand_kwh_h;
  });

  const bestZone = sortedZones.find((z) => z.selected);
  const otherSelected = sortedZones.filter((z) => z.selected && z !== bestZone);

  const maxDemand = Math.max(...zone_details.map((z) => z.predicted_demand_kwh_h), 1);

  return (
    <div
      className="anim-slide-up"
      style={{ display: "flex", flexDirection: "column", gap: "0" }}
    >
      {/* Context header */}
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-ink-4)",
            marginBottom: "4px",
          }}
        >
          Nearest to {locationName}
        </div>
        <div
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "-0.015em",
            color: "var(--color-ink)",
            lineHeight: 1.2,
          }}
        >
          Your best charging option
        </div>
      </div>

      {/* Best match */}
      {bestZone && (() => {
        const dist = haversine(userLat, userLng, bestZone.latitude, bestZone.longitude);
        const demand = bestZone.predicted_demand_kwh_h;
        const quality = qualityLabel(demand, maxDemand);

        return (
          <div
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid var(--color-border-subtle)",
              background: "var(--color-navy-50)",
            }}
          >
            {/* Zone id + distance */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "32px",
                  letterSpacing: "-0.025em",
                  color: "var(--color-navy-900)",
                  lineHeight: 1,
                }}
              >
                Station {bestZone.label.replace("Z", "")}
              </div>
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "13px",
                  color: "var(--color-ink-3)",
                }}
              >
                {formatDist(dist)}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
              <div>
                <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)", marginBottom: "2px" }}>
                  Charging activity
                </div>
                <div style={{ fontFamily: "Times New Roman, serif", fontSize: "16px", color: "var(--color-ink)" }}>
                  {formatDemand(demand)}
                </div>
              </div>
              <div style={{ width: "1px", background: "var(--color-border)" }} />
              <div>
                <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)", marginBottom: "2px" }}>
                  Location quality
                </div>
                <div style={{ fontFamily: "Times New Roman, serif", fontSize: "16px", color: quality.color }}>
                  {quality.label}
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${bestZone.latitude},${bestZone.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                background: "var(--color-navy-900)",
                color: "white",
                textAlign: "center",
                textDecoration: "none",
                fontFamily: "Times New Roman, serif",
                fontSize: "15px",
                letterSpacing: "-0.005em",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              View route →
            </a>
          </div>
        );
      })()}

      {/* Other recommended options */}
      {otherSelected.length > 0 && (
        <div>
          <div
            style={{
              padding: "12px 22px 8px",
              fontFamily: "Times New Roman, serif",
              fontSize: "11px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-ink-4)",
            }}
          >
            Also recommended
          </div>
          {otherSelected.map((zone, i) => {
            const dist = haversine(userLat, userLng, zone.latitude, zone.longitude);
            const demand = zone.predicted_demand_kwh_h;

            return (
              <div
                key={zone.label}
                className={`anim-fade-in d-${i + 2}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 22px",
                  borderBottom: i < otherSelected.length - 1
                    ? "1px solid var(--color-border-subtle)"
                    : "none",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-grey-50)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Mini marker */}
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "var(--color-navy-800)",
                    border: "2px solid white",
                    boxShadow: "0 1px 4px rgba(10,22,40,0.2)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "15px",
                      color: "var(--color-ink)",
                    }}
                  >
                    Station {zone.label.replace("Z", "")}
                  </div>
                  <div
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "12px",
                      color: "var(--color-ink-4)",
                    }}
                  >
                    {formatDemand(demand)} · {formatDist(dist)}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${zone.latitude},${zone.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "12px",
                    color: "var(--color-navy-500)",
                    textDecoration: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-navy-200)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-navy-50)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Route
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Search again */}
      <div
        style={{
          padding: "14px 22px",
          borderTop: "1px solid var(--color-border-subtle)",
        }}
      >
        <button
          onClick={onReset}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            background: "transparent",
            fontFamily: "Times New Roman, serif",
            fontSize: "14px",
            color: "var(--color-ink-3)",
            cursor: "pointer",
            transition: "all 0.15s ease",
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
          Search again
        </button>
      </div>
    </div>
  );
}
