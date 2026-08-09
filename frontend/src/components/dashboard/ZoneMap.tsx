"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ZoneDetail } from "@/types/api";

interface ZoneMapProps {
  zoneDetails: ZoneDetail[];
}

function projectToSVG(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  svgW: number,
  svgH: number,
  padding: number,
): { x: number; y: number } {
  const usableW = svgW - padding * 2;
  const usableH = svgH - padding * 2;
  const latRange = bounds.maxLat - bounds.minLat || 0.01;
  const lngRange = bounds.maxLng - bounds.minLng || 0.01;

  const x = padding + ((lng - bounds.minLng) / lngRange) * usableW;
  // Latitude increases upward in geo, but downward in SVG
  const y = padding + ((bounds.maxLat - lat) / latRange) * usableH;
  return { x, y };
}

export function ZoneMap({ zoneDetails }: ZoneMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!zoneDetails.length) return null;

  const SVG_W = 460;
  const SVG_H = 300;
  const PADDING = 36;

  const lats = zoneDetails.map((z) => z.latitude);
  const lngs = zoneDetails.map((z) => z.longitude);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };

  // Add a bit of margin so points aren't on the edge
  const latPad = (bounds.maxLat - bounds.minLat) * 0.18 || 0.005;
  const lngPad = (bounds.maxLng - bounds.minLng) * 0.18 || 0.005;
  const paddedBounds = {
    minLat: bounds.minLat - latPad,
    maxLat: bounds.maxLat + latPad,
    minLng: bounds.minLng - lngPad,
    maxLng: bounds.maxLng + lngPad,
  };

  const points = zoneDetails.map((z) => ({
    ...z,
    ...projectToSVG(z.latitude, z.longitude, paddedBounds, SVG_W, SVG_H, PADDING),
  }));

  const maxDemand = Math.max(...zoneDetails.map((z) => z.predicted_demand_kwh_h));

  return (
    <div className="card-elevated p-6 flex flex-col gap-5 animate-fade-in stagger-3">
      <SectionHeader
        title="Zone Locations"
        subtitle="Candidate charging sites · Shenzhen"
      />

      <div
        className="relative rounded-xl overflow-hidden"
        style={{ background: "var(--color-navy-950)" }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ display: "block" }}
          aria-label="Map of candidate EV charging zones"
          role="img"
        >
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={PADDING}
              y1={PADDING + ((SVG_H - PADDING * 2) / 4) * i}
              x2={SVG_W - PADDING}
              y2={PADDING + ((SVG_H - PADDING * 2) / 4) * i}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={PADDING + ((SVG_W - PADDING * 2) / 6) * i}
              y1={PADDING}
              x2={PADDING + ((SVG_W - PADDING * 2) / 6) * i}
              y2={SVG_H - PADDING}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Connection lines between selected zones */}
          {(() => {
            const selected = points.filter((p) => p.selected);
            const lines: React.ReactNode[] = [];
            for (let i = 0; i < selected.length; i++) {
              for (let j = i + 1; j < selected.length; j++) {
                lines.push(
                  <line
                    key={`conn-${i}-${j}`}
                    x1={selected[i].x}
                    y1={selected[i].y}
                    x2={selected[j].x}
                    y2={selected[j].y}
                    stroke="rgba(74,123,196,0.25)"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />,
                );
              }
            }
            return lines;
          })()}

          {/* Zone nodes */}
          {points.map((z, idx) => {
            const isHovered = hovered === z.label;
            const relSize = 0.5 + (z.predicted_demand_kwh_h / maxDemand) * 0.5;
            const baseR = z.selected ? 8 : 5.5;
            const r = baseR * relSize;

            return (
              <g
                key={z.label}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(z.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  animation: `scale-in 0.4s cubic-bezier(0.16,1,0.3,1) ${0.05 + idx * 0.06}s both`,
                  transformOrigin: `${z.x}px ${z.y}px`,
                }}
              >
                {/* Glow ring for selected */}
                {z.selected && (
                  <circle
                    cx={z.x}
                    cy={z.y}
                    r={r + 8}
                    fill="rgba(74,123,196,0.12)"
                    stroke="rgba(74,123,196,0.2)"
                    strokeWidth="1"
                    className="animate-pulse-soft"
                  />
                )}

                {/* Main dot */}
                <circle
                  cx={z.x}
                  cy={z.y}
                  r={isHovered ? r + 2 : r}
                  fill={
                    z.selected
                      ? "var(--color-navy-400)"
                      : "rgba(255,255,255,0.18)"
                  }
                  stroke={
                    z.selected
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(255,255,255,0.1)"
                  }
                  strokeWidth={z.selected ? 1.5 : 1}
                  style={{ transition: "r 0.15s ease" }}
                />

                {/* Label */}
                <text
                  x={z.x}
                  y={z.y - r - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fontWeight={z.selected ? "600" : "400"}
                  fill={
                    z.selected
                      ? "rgba(179,204,234,1)"
                      : "rgba(255,255,255,0.4)"
                  }
                >
                  {z.label}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {hovered &&
            (() => {
              const p = points.find((z) => z.label === hovered);
              if (!p) return null;
              const tx = Math.min(p.x + 12, SVG_W - 120);
              const ty = Math.max(p.y - 56, 8);
              return (
                <g>
                  <rect
                    x={tx}
                    y={ty}
                    width={110}
                    height={48}
                    rx="6"
                    fill="rgba(13,26,46,0.92)"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="0.5"
                  />
                  <text x={tx + 10} y={ty + 16} fontSize="10" fill="rgba(255,255,255,0.9)" fontWeight="600">
                    {p.label} · TAZID {p.tazid}
                  </text>
                  <text x={tx + 10} y={ty + 30} fontSize="9" fill="rgba(255,255,255,0.5)">
                    {p.predicted_demand_kwh_h >= 1000
                      ? `${(p.predicted_demand_kwh_h / 1000).toFixed(2)} MWh/h`
                      : `${p.predicted_demand_kwh_h.toFixed(1)} kWh/h`}
                  </text>
                  <text x={tx + 10} y={ty + 42} fontSize="8" fill="rgba(255,255,255,0.3)">
                    {p.latitude.toFixed(4)}°N {p.longitude.toFixed(4)}°E
                  </text>
                </g>
              );
            })()}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: "var(--color-navy-400)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            />
            <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Selected
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.18)" }}
            />
            <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Candidate
            </span>
          </div>
        </div>
      </div>

      {/* Zone list */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {zoneDetails.map((z) => (
          <div
            key={z.label}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150 ${z.selected ? "bg-[var(--color-navy-50)]" : "bg-[var(--color-surface-2)]"}`}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: z.selected
                  ? "var(--color-navy-600)"
                  : "var(--color-border-strong)",
              }}
            />
            <span
              className="text-xs font-medium"
              style={{
                color: z.selected
                  ? "var(--color-navy-700)"
                  : "var(--color-text-tertiary)",
              }}
            >
              {z.label}
            </span>
            <span
              className="text-[10px] ml-auto tabular-nums"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {z.longitude.toFixed(3)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
