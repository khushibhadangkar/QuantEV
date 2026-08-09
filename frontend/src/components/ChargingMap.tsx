"use client";

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { ZoneDetail } from "@/types/api";

export interface ChargingMapHandle {
  setUserLocation: (lat: number, lng: number) => void;
  startSearchAnimation: () => void;
  showResults: (zones: ZoneDetail[], selected: string[]) => void;
  resetToIdle: () => void;
}

interface ChargingMapProps {
  onReady?: () => void;
}

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

const ChargingMap = forwardRef<ChargingMapHandle, ChargingMapProps>(
  ({ onReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const searchCirclesRef = useRef<any[]>([]);
    const zoneMarkersRef = useRef<any[]>([]);
    const userLatLngRef = useRef<[number, number]>([22.62, 114.08]);

    const initMap = useCallback(async () => {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;

      const map = L.map(containerRef.current, {
        center: [22.625, 114.075],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      // Premium light tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      onReady?.();
    }, [onReady]);

    useEffect(() => {
      initMap();
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }, [initMap]);

    useImperativeHandle(ref, () => ({
      setUserLocation(lat: number, lng: number) {
        if (!mapRef.current) return;
        import("leaflet").then(({ default: L }) => {
          const map = mapRef.current;
          userLatLngRef.current = [lat, lng];

          // Remove old user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
          }

          // User location marker — elegant pulsing pin
          const userIcon = L.divIcon({
            className: "",
            html: `
              <div style="position:relative;width:48px;height:48px;transform:translate(-24px,-24px);">
                <!-- Pulse rings -->
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(10,22,40,0.12);animation:pulse-1 2s ease-out infinite;"></div>
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(10,22,40,0.07);animation:pulse-2 2s ease-out 0.6s infinite;"></div>
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(10,22,40,0.04);animation:pulse-3 2s ease-out 1.2s infinite;"></div>
                <!-- Pin body -->
                <div style="
                  position:absolute;
                  top:50%;left:50%;
                  transform:translate(-50%,-50%);
                  width:20px;height:20px;border-radius:50%;
                  background:var(--color-navy-900);
                  border:3px solid white;
                  box-shadow:0 4px 16px rgba(10,22,40,0.35);
                  animation:drop-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
                "></div>
              </div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const marker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
          userMarkerRef.current = marker;

          // Smooth fly to user location
          map.flyTo([lat, lng], 14, { duration: 1.4, easeLinearity: 0.25 });
        });
      },

      startSearchAnimation() {
        if (!mapRef.current) return;
        import("leaflet").then(({ default: L }) => {
          const map = mapRef.current;
          const [lat, lng] = userLatLngRef.current;

          // Remove old circles
          searchCirclesRef.current.forEach((c) => c.remove());
          searchCirclesRef.current = [];

          // Expanding search circles at different radii
          const radii = [800, 1600, 2800];
          radii.forEach((r, i) => {
            setTimeout(() => {
              const circle = L.circle([lat, lng], {
                radius: r,
                color: "rgba(10,22,40,0.15)",
                fillColor: "rgba(10,22,40,0.03)",
                fillOpacity: 1,
                weight: 1,
                dashArray: "4 6",
              }).addTo(map);
              searchCirclesRef.current.push(circle);
            }, i * 380);
          });

          // Zoom out slightly to show search radius
          setTimeout(() => {
            map.flyTo([lat, lng], 13, { duration: 1.0, easeLinearity: 0.3 });
          }, 200);
        });
      },

      showResults(zones: ZoneDetail[], selected: string[]) {
        if (!mapRef.current) return;
        import("leaflet").then(({ default: L }) => {
          const map = mapRef.current;
          const selectedSet = new Set(selected);

          // Clear search circles
          searchCirclesRef.current.forEach((c) => c.remove());
          searchCirclesRef.current = [];

          // Clear old zone markers
          zoneMarkersRef.current.forEach((m) => m.remove());
          zoneMarkersRef.current = [];

          const userLat = userLatLngRef.current[0];
          const userLng = userLatLngRef.current[1];

          // Add zone markers with staggered animation
          zones.forEach((zone, i) => {
            const isSelected = selectedSet.has(zone.label);
            const dist = haversine(userLat, userLng, zone.latitude, zone.longitude);
            const distStr = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;

            setTimeout(() => {
              if (!mapRef.current) return;

              const demand = zone.predicted_demand_kwh_h;
              const demandStr = demand >= 1000
                ? `${(demand / 1000).toFixed(1)} MWh/h`
                : `${Math.round(demand)} kWh/h`;

              if (isSelected) {
                // Best match marker — larger, navy, prominent
                const bestIcon = L.divIcon({
                  className: "",
                  html: `
                    <div style="position:relative;width:56px;height:56px;transform:translate(-28px,-28px);">
                      <!-- Outer pulse rings -->
                      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(10,22,40,0.14);animation:pulse-1 2.4s ease-out infinite;"></div>
                      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(10,22,40,0.08);animation:pulse-2 2.4s ease-out 0.8s infinite;"></div>
                      <!-- Main pin -->
                      <div style="
                        position:absolute;top:50%;left:50%;
                        transform:translate(-50%,-50%);
                        width:28px;height:28px;border-radius:50%;
                        background:var(--color-navy-900);
                        border:3.5px solid white;
                        box-shadow:0 6px 24px rgba(10,22,40,0.40);
                        display:flex;align-items:center;justify-content:center;
                        animation:station-appear 0.5s cubic-bezier(0.22,1,0.36,1) both;
                      ">
                        <div style="
                          width:8px;height:8px;border-radius:50%;
                          background:white;opacity:0.9;
                        "></div>
                      </div>
                    </div>`,
                  iconSize: [0, 0],
                  iconAnchor: [0, 0],
                });

                const marker = L.marker([zone.latitude, zone.longitude], {
                  icon: bestIcon,
                  zIndexOffset: 1500,
                }).addTo(map);

                // Rich popup
                const popup = L.popup({
                  closeButton: true,
                  maxWidth: 260,
                  offset: [0, -10],
                }).setContent(`
                  <div style="font-family:Times New Roman,serif;padding:20px 22px;min-width:220px;">
                    <div style="
                      display:inline-flex;align-items:center;gap:6px;
                      background:var(--color-navy-900);color:white;
                      font-size:10px;letter-spacing:0.08em;
                      padding:4px 10px;border-radius:99px;margin-bottom:14px;
                    ">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <circle cx="4" cy="4" r="2.5" fill="white"/>
                        <circle cx="4" cy="4" r="4" stroke="white" stroke-width="0.7" fill="none" opacity="0.4"/>
                      </svg>
                      Best match
                    </div>
                    <div style="font-size:26px;letter-spacing:-0.025em;color:var(--color-ink);margin-bottom:6px;">
                      Station ${zone.label.replace("Z", "")}
                    </div>
                    <div style="font-size:13px;color:var(--color-ink-3);margin-bottom:16px;">
                      ${zone.latitude.toFixed(4)}°N, ${zone.longitude.toFixed(4)}°E
                    </div>
                    <div style="border-top:1px solid var(--color-border);padding-top:14px;display:flex;flex-direction:column;gap:10px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12px;color:var(--color-ink-4);">Distance from you</span>
                        <span style="font-size:15px;color:var(--color-ink);font-weight:400;">${distStr}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12px;color:var(--color-ink-4);">Charging activity</span>
                        <span style="font-size:15px;color:var(--color-ink);">${demandStr}</span>
                      </div>
                    </div>
                    <button
                      onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${zone.latitude},${zone.longitude}','_blank')"
                      style="
                        margin-top:16px;width:100%;
                        padding:10px;border-radius:10px;border:none;
                        background:var(--color-navy-900);color:white;
                        font-family:Times New Roman,serif;font-size:14px;
                        cursor:pointer;
                      "
                    >
                      View route →
                    </button>
                  </div>
                `);

                marker.bindPopup(popup);
                zoneMarkersRef.current.push(marker);

                // Auto-open popup for best match
                if (i === zones.findIndex((z) => z.selected)) {
                  setTimeout(() => marker.openPopup(), 600);
                }
              } else {
                // Secondary candidate — smaller, outline
                const candIcon = L.divIcon({
                  className: "",
                  html: `
                    <div style="
                      width:20px;height:20px;border-radius:50%;
                      background:white;
                      border:2px solid rgba(10,22,40,0.35);
                      box-shadow:0 2px 10px rgba(10,22,40,0.12);
                      transform:translate(-10px,-10px);
                      animation:station-appear 0.45s cubic-bezier(0.22,1,0.36,1) both;
                    "></div>`,
                  iconSize: [0, 0],
                  iconAnchor: [0, 0],
                });

                const marker = L.marker([zone.latitude, zone.longitude], {
                  icon: candIcon,
                  zIndexOffset: 800,
                }).addTo(map);

                const popup = L.popup({
                  closeButton: true,
                  maxWidth: 220,
                  offset: [0, -6],
                }).setContent(`
                  <div style="font-family:Times New Roman,serif;padding:16px 18px;min-width:180px;">
                    <div style="
                      display:inline-block;
                      background:var(--color-grey-100);color:var(--color-ink-3);
                      font-size:10px;letter-spacing:0.08em;
                      padding:3px 8px;border-radius:4px;margin-bottom:10px;
                    ">Nearby option</div>
                    <div style="font-size:22px;color:var(--color-ink);letter-spacing:-0.02em;margin-bottom:4px;">
                      Station ${zone.label.replace("Z", "")}
                    </div>
                    <div style="border-top:1px solid var(--color-border);padding-top:10px;margin-top:8px;display:flex;flex-direction:column;gap:8px;">
                      <div style="display:flex;justify-content:space-between;">
                        <span style="font-size:12px;color:var(--color-ink-4);">Distance</span>
                        <span style="font-size:13px;color:var(--color-ink);">${distStr}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;">
                        <span style="font-size:12px;color:var(--color-ink-4);">Activity</span>
                        <span style="font-size:13px;color:var(--color-ink);">${demandStr}</span>
                      </div>
                    </div>
                  </div>
                `);

                marker.bindPopup(popup);
                zoneMarkersRef.current.push(marker);
              }
            }, i * 140);
          });

          // After all markers appear, fit to selected zones
          const selectedZones = zones.filter((z) => selectedSet.has(z.label));
          if (selectedZones.length > 0) {
            setTimeout(() => {
              if (!mapRef.current) return;
              const bounds = L.latLngBounds([
                ...selectedZones.map((z) => [z.latitude, z.longitude] as [number, number]),
                userLatLngRef.current,
              ]).pad(0.35);
              mapRef.current.flyToBounds(bounds, { duration: 1.6, easeLinearity: 0.2 });
            }, zones.length * 140 + 400);
          }
        });
      },

      resetToIdle() {
        if (!mapRef.current) return;
        // Remove all markers and circles
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
        searchCirclesRef.current.forEach((c) => c.remove());
        searchCirclesRef.current = [];
        zoneMarkersRef.current.forEach((m) => m.remove());
        zoneMarkersRef.current = [];

        userLatLngRef.current = [22.62, 114.08];

        if (mapRef.current) {
          mapRef.current.flyTo([22.625, 114.075], 13, {
            duration: 1.2,
            easeLinearity: 0.3,
          });
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", background: "#dde4ed" }}
      />
    );
  }
);

ChargingMap.displayName = "ChargingMap";
export default ChargingMap;
