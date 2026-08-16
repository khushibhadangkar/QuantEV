"use client";

interface PlanningControlsProps {
  stationCount: number;
  onStationCountChange: (n: number) => void;
  disabled?: boolean;
}

const STATION_OPTIONS = [2, 3, 4, 5];

export function PlanningControls({ stationCount, onStationCountChange, disabled }: PlanningControlsProps) {
  return (
    <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "10px" }}>
        Planning parameters
      </div>

      {/* Station count selector */}
      <div>
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
    </div>
  );
}
