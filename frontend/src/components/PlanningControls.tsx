"use client";

interface PlanningControlsProps {
  stationCount: number;
  onStationCountChange: (n: number) => void;
  disabled?: boolean;
}

const STATION_OPTIONS = [2, 3, 4, 5];

const COST_PER_STATION_CNY = 2_800_000; // ~¥2.8M per fast-charging station (realistic Shenzhen estimate)

function formatCNY(cny: number): string {
  if (cny >= 1_000_000) return `¥${(cny / 1_000_000).toFixed(1)}M`;
  return `¥${(cny / 1000).toFixed(0)}K`;
}

export function PlanningControls({ stationCount, onStationCountChange, disabled }: PlanningControlsProps) {
  const totalCost = stationCount * COST_PER_STATION_CNY;

  return (
    <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "10px" }}>
        Planning parameters
      </div>

      {/* Station count selector */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "13px", color: "var(--color-ink-2)", marginBottom: "8px" }}>
          Stations to place
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {STATION_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => !disabled && onStationCountChange(n)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: "8px",
                border: n === stationCount ? "1.5px solid var(--color-navy-700)" : "1px solid var(--color-border)",
                background: n === stationCount ? "var(--color-navy-900)" : "transparent",
                color: n === stationCount ? "white" : "var(--color-ink-3)",
                fontFamily: "Times New Roman, serif",
                fontSize: "15px",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                opacity: disabled ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!disabled && n !== stationCount) {
                  e.currentTarget.style.borderColor = "var(--color-navy-300)";
                  e.currentTarget.style.color = "var(--color-ink)";
                }
              }}
              onMouseLeave={(e) => {
                if (n !== stationCount) {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-ink-3)";
                }
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Cost estimate */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "var(--color-grey-50)",
          borderRadius: "8px",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <span style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", color: "var(--color-ink-4)" }}>
          Estimated capital cost
        </span>
        <span style={{ fontFamily: "Times New Roman, serif", fontSize: "14px", color: "var(--color-ink-2)" }}>
          {formatCNY(totalCost)}
        </span>
      </div>
    </div>
  );
}
