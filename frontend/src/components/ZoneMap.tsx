"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ZoneDetail } from "@/types/api";

interface ZoneMapProps {
  zoneDetails: ZoneDetail[];
  selectedZones: string[];
  isResult: boolean;
  height?: string;
}

function formatDemand(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh/h`;
  return `${kwh.toFixed(0)} kWh/h`;
}

export function ZoneMap({
  zoneDetails,
  selectedZones,
  isResult,
  height = "520px",
}: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const selectedSet = new Set(selectedZones);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    const L = (await import("leaflet")).default;

    // Shenzhen center
    const center: [number, number] = [22.6, 114.08];

    const map = L.map(containerRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles — clean, no clutter
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;
  }, []);

  const renderMarkers = useCallback(async () => {
    if (!mapRef.current || zoneDetails.length === 0) return;

    const L = (await import("leaflet")).default;
    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    zoneDetails.forEach((zone) => {
      const isSelected = selectedSet.has(zone.label);

      // Pulse ring for selected zones
      if (isSelected) {
        const pulseIcon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:36px;height:36px;transform:translate(-18px,-18px)">
              <div style="
                position:absolute;inset:0;border-radius:50%;
                background:rgba(22,45,88,0.15);
                animation:pulse-ring 2s ease-out infinite;
              "></div>
              <div style="
                position:absolute;top:5px;left:5px;
                width:26px;height:26px;border-radius:50%;
                background:var(--color-navy-800);
                border:3px solid white;
                box-shadow:0 4px 16px rgba(10,22,40,0.3);
                display:flex;align-items:center;justify-content:center;
              ">
                <div style="width:6px;height:6px;border-radius:50%;background:white;opacity:0.8;"></div>
              </div>
            </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([zone.latitude, zone.longitude], {
          icon: pulseIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        const popup = L.popup({
          closeButton: true,
          maxWidth: 240,
          minWidth: 200,
          offset: [0, -8],
        }).setContent(`
          <div style="
            font-family:Times New Roman,serif;
            padding:16px 18px;
            background:white;
          ">
            <div style="
              display:inline-block;
              background:var(--color-navy-900);
              color:white;
              font-size:10px;
              letter-spacing:0.08em;
              padding:3px 8px;
              border-radius:4px;
              margin-bottom:10px;
            ">RECOMMENDED</div>
            <div style="
              font-size:22px;
              font-weight:400;
              color:var(--color-ink);
              letter-spacing:-0.02em;
              margin-bottom:4px;
            ">${zone.label}</div>
            <div style="font-size:13px;color:var(--color-ink-3);margin-bottom:10px;">
              TAZID ${zone.tazid}
            </div>
            <div style="border-top:1px solid var(--color-border);padding-top:10px;">
              <div style="font-size:12px;color:var(--color-ink-3);margin-bottom:2px;">Predicted demand</div>
              <div style="font-size:18px;color:var(--color-navy-800);font-weight:400;">
                ${formatDemand(zone.predicted_demand_kwh_h)}
              </div>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--color-ink-4);">
              ${zone.latitude.toFixed(5)}°N, ${zone.longitude.toFixed(5)}°E
            </div>
          </div>
        `);

        marker.bindPopup(popup);
        markersRef.current.push(marker);
      } else {
        const candidateIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              width:18px;height:18px;
              border-radius:50%;
              background:white;
              border:2px solid rgba(64,114,184,0.6);
              box-shadow:0 2px 8px rgba(10,22,40,0.12);
              transform:translate(-9px,-9px);
              transition:transform 0.2s ease;
              cursor:pointer;
            "></div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([zone.latitude, zone.longitude], {
          icon: candidateIcon,
          zIndexOffset: 500,
        }).addTo(map);

        const popup = L.popup({
          closeButton: true,
          maxWidth: 220,
          minWidth: 180,
          offset: [0, -4],
        }).setContent(`
          <div style="font-family:Times New Roman,serif;padding:14px 16px;background:white;">
            <div style="
              display:inline-block;
              background:var(--color-grey-100);
              color:var(--color-ink-3);
              font-size:10px;
              letter-spacing:0.08em;
              padding:3px 8px;
              border-radius:4px;
              margin-bottom:8px;
            ">CANDIDATE</div>
            <div style="font-size:20px;color:var(--color-ink);letter-spacing:-0.02em;margin-bottom:4px;">
              ${zone.label}
            </div>
            <div style="font-size:13px;color:var(--color-ink-3);margin-bottom:8px;">
              TAZID ${zone.tazid}
            </div>
            <div style="border-top:1px solid var(--color-border);padding-top:8px;">
              <div style="font-size:11px;color:var(--color-ink-4);margin-bottom:2px;">Predicted demand</div>
              <div style="font-size:16px;color:var(--color-ink-2);">
                ${formatDemand(zone.predicted_demand_kwh_h)}
              </div>
            </div>
          </div>
        `);

        marker.bindPopup(popup);
        markersRef.current.push(marker);
      }
    });

    // If result mode, fly to fit the selected zones
    if (isResult && selectedZones.length > 0) {
      const selectedDetails = zoneDetails.filter((z) =>
        selectedSet.has(z.label)
      );
      if (selectedDetails.length > 0) {
        const bounds = L.latLngBounds(
          selectedDetails.map((z) => [z.latitude, z.longitude] as [number, number])
        ).pad(0.4);
        map.flyToBounds(bounds, { duration: 1.8, easeLinearity: 0.25 });
      }
    } else if (!isResult && zoneDetails.length > 0) {
      // Fit all candidates
      const allBounds = L.latLngBounds(
        zoneDetails.map((z) => [z.latitude, z.longitude] as [number, number])
      ).pad(0.2);
      map.fitBounds(allBounds, { animate: false });
    }
  }, [zoneDetails, selectedZones, isResult, selectedSet]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        boxShadow: "0 8px 40px rgba(10,22,40,0.08)",
      }}
    />
  );
}
