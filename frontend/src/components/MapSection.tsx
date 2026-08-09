"use client";

import dynamic from "next/dynamic";
import type { ZoneDetail } from "@/types/api";

// ZoneMap must be dynamically imported (no SSR) because Leaflet requires window
const ZoneMap = dynamic(
  () => import("./ZoneMap").then((m) => ({ default: m.ZoneMap })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "520px",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}
        className="skeleton"
      />
    ),
  }
);

interface MapSectionProps {
  zoneDetails: ZoneDetail[];
  selectedZones: string[];
  isResult: boolean;
  title: string;
  subtitle: string;
}

export function MapSection({
  zoneDetails,
  selectedZones,
  isResult,
  title,
  subtitle,
}: MapSectionProps) {
  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--color-white)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px" }}>
        {/* Section header */}
        <div
          className="anim-fade-up d-0"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "Times New Roman, serif",
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-ink-4)",
                marginBottom: "8px",
              }}
            >
              Shenzhen · {zoneDetails.length} candidate zones
            </p>
            <h2
              style={{
                fontFamily: "Times New Roman, serif",
                fontSize: "clamp(22px, 2.5vw, 32px)",
                fontWeight: 400,
                letterSpacing: "-0.015em",
                color: "var(--color-ink)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontFamily: "Times New Roman, serif",
                fontSize: "14px",
                color: "var(--color-ink-3)",
                marginTop: "6px",
              }}
            >
              {subtitle}
            </p>
          </div>

          {isResult && selectedZones.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {selectedZones.map((z) => (
                <div
                  key={z}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "var(--color-navy-900)",
                    color: "white",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "14px",
                  }}
                >
                  {z}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="anim-scale-up d-1">
          <ZoneMap
            zoneDetails={zoneDetails}
            selectedZones={selectedZones}
            isResult={isResult}
            height="520px"
          />
        </div>

        {/* Map legend */}
        <div
          className="anim-fade-up d-2"
          style={{
            marginTop: "16px",
            display: "flex",
            gap: "24px",
            fontFamily: "Times New Roman, serif",
            fontSize: "12px",
            color: "var(--color-ink-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--color-navy-800)",
                border: "2px solid white",
                boxShadow: "0 1px 4px rgba(10,22,40,0.2)",
              }}
            />
            Recommended location
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "white",
                border: "2px solid rgba(64,114,184,0.5)",
                boxShadow: "0 1px 3px rgba(10,22,40,0.1)",
              }}
            />
            Candidate zone
          </div>
          <div style={{ color: "var(--color-ink-4)", marginLeft: "auto" }}>
            Click any zone for details
          </div>
        </div>
      </div>
    </section>
  );
}
