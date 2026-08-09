"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useOptimize } from "@/hooks/useOptimize";
import { SearchBar } from "@/components/SearchBar";
import { SearchProgress } from "@/components/SearchProgress";
import { ResultPanel } from "@/components/ResultPanel";
import { HowItWorks } from "@/components/HowItWorks";
import type { ChargingMapHandle } from "@/components/ChargingMap";

// SSR-safe dynamic import (Leaflet requires window)
const ChargingMap = dynamic(
  () => import("@/components/ChargingMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ width: "100%", height: "100%", background: "#dde4ed" }}
        className="skeleton"
      />
    ),
  }
);

type UIPhase =
  | "idle"          // Map open, search bar waiting
  | "located"       // User set location, waiting for them to confirm
  | "searching"     // API in flight + map animations
  | "result"        // Results showing
  | "error";        // Error state

export default function Page() {
  const { state, run, reset } = useOptimize();
  const mapRef = useRef<ChargingMapHandle>(null);
  const resultScrollRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<UIPhase>("idle");
  const [userLat, setUserLat] = useState(22.62);
  const [userLng, setUserLng] = useState(114.075);
  const [locationName, setLocationName] = useState("Shenzhen");

  // Called when user picks a location from search
  const handleLocationSelect = useCallback(
    (lat: number, lng: number, name: string) => {
      setUserLat(lat);
      setUserLng(lng);
      setLocationName(name);
      setPhase("located");
      mapRef.current?.setUserLocation(lat, lng);
    },
    []
  );

  // Called when user confirms — kick off search
  const handleSearch = useCallback(async () => {
    setPhase("searching");
    mapRef.current?.startSearchAnimation();
    await run();
  }, [run]);

  // Handle state transitions after API resolves
  const prevStatusRef = useRef(state.status);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (state.status !== prevStatusRef.current) {
    prevStatusRef.current = state.status;
    if (state.status === "success") {
      setPhase("result");
      // Drive map with a microtask so the state flush is committed first
      Promise.resolve().then(() => {
        if (state.status === "success") {
          mapRef.current?.showResults(
            state.data.recommendation.zone_details,
            state.data.recommendation.selected_zones,
          );
        }
      });
      setTimeout(() => {
        resultScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 900);
    }
    if (state.status === "error") {
      setPhase("error");
    }
  }

  // Reset everything
  const handleReset = useCallback(() => {
    reset();
    setPhase("idle");
    mapRef.current?.resetToIdle();
  }, [reset]);

  return (
    // The page is a full-viewport column. The map section takes up all remaining
    // space after the 56px fixed header. It uses calc() for an explicit height
    // so absolute-positioned children (the Leaflet container) have a real
    // pixel dimension to resolve against — flex:1 alone is not enough.
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "white" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header
        className="glass"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--color-navy-900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2" fill="white" />
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="0.8" fill="none" opacity="0.45" />
              <circle cx="6" cy="6" r="6" stroke="white" strokeWidth="0.4" fill="none" opacity="0.2" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "16px",
              color: "var(--color-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            QuantEV
          </span>
        </div>

        {/* Phase indicator */}
        <div
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "13px",
            color: "var(--color-ink-4)",
          }}
        >
          {phase === "idle" && "Infrastructure Planning · Shenzhen"}
          {phase === "located" && "Planning area selected"}
          {phase === "searching" && "Analysing…"}
          {phase === "result" && "Recommendation ready"}
          {phase === "error" && "Analysis failed"}
        </div>

        {/* Reset (only when not idle) */}
        {phase !== "idle" && (
          <button
            onClick={handleReset}
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "13px",
              color: "var(--color-ink-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-ink-3)")}
          >
            New analysis
          </button>
        )}
      </header>

      {/* ── MAP + OVERLAY PANEL ────────────────────────────── */}
      {/* Explicit height so absolute children have a real pixel dimension.
          flex:1 alone does not give absolute-positioned children anything to
          resolve against — this is the root cause of the blank map. */}
      <div style={{
        position: "relative",
        height: "calc(100vh - 56px)",
        marginTop: "56px",
        flexShrink: 0,
      }}>

        {/* Full-bleed map — fills the entire section */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <ChargingMap ref={mapRef} />
        </div>

        {/* ── LEFT OVERLAY PANEL ───────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "360px",
            maxWidth: "calc(100vw - 40px)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >

          {/* ── IDLE: Search bar ─────────────────────────── */}
          {phase === "idle" && (
            <div className="anim-fade-in">
              {/* Welcome card */}
              <div
                className="glass"
                style={{
                  borderRadius: "20px",
                  padding: "22px 24px 20px",
                  marginBottom: "10px",
                  boxShadow: "0 8px 32px rgba(10,22,40,0.1)",
                }}
              >
                <h1
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "22px",
                    fontWeight: 400,
                    letterSpacing: "-0.015em",
                    color: "var(--color-ink)",
                    marginBottom: "6px",
                    lineHeight: 1.2,
                  }}
                >
                  Find the best locations for
                  <br />
                  <em style={{ color: "var(--color-navy-700)" }}>new charging infrastructure</em>
                </h1>
                <p
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "13px",
                    color: "var(--color-ink-3)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Select a planning area in Shenzhen to analyse predicted EV demand
                  and identify the optimal sites for new charging stations.
                </p>
              </div>

              {/* Search bar */}
              <SearchBar onLocationSelect={handleLocationSelect} />
            </div>
          )}

          {/* ── LOCATED: Confirm search ───────────────────── */}
          {phase === "located" && (
            <div className="anim-scale-in">
              <div
                className="glass"
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
                }}
              >
                {/* Location confirmed */}
                <div
                  style={{
                    padding: "18px 22px",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "var(--color-navy-900)",
                      border: "2px solid white",
                      boxShadow: "0 1px 4px rgba(10,22,40,0.25)",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: "Times New Roman, serif",
                        fontSize: "14px",
                        color: "var(--color-ink)",
                      }}
                    >
                      {locationName}
                    </div>
                    <div
                      style={{
                        fontFamily: "Times New Roman, serif",
                        fontSize: "11px",
                        color: "var(--color-ink-4)",
                      }}
                    >
                      Planning area · {userLat.toFixed(4)}°N, {userLng.toFixed(4)}°E
                    </div>
                  </div>
                  <button
                    onClick={() => setPhase("idle")}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-ink-4)",
                      fontFamily: "Times New Roman, serif",
                      fontSize: "13px",
                      padding: "4px 8px",
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* Analyse button */}
                <div style={{ padding: "16px 22px" }}>
                  <button
                    onClick={handleSearch}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "none",
                      background: "var(--color-navy-900)",
                      color: "white",
                      fontFamily: "Times New Roman, serif",
                      fontSize: "16px",
                      letterSpacing: "-0.005em",
                      cursor: "pointer",
                      transition: "opacity 0.2s ease, transform 0.15s ease",
                      boxShadow: "0 4px 16px rgba(10,22,40,0.22)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Analyse infrastructure →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SEARCHING: Progress ───────────────────────── */}
          {phase === "searching" && (
            <div className="anim-scale-in">
              <div
                className="glass"
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
                }}
              >
                <SearchProgress />
              </div>
            </div>
          )}

          {/* ── RESULT ────────────────────────────────────── */}
          {phase === "result" && state.status === "success" && (
            <div className="anim-slide-up" ref={resultScrollRef}>
              <div
                className="glass"
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 12px 48px rgba(10,22,40,0.16)",
                }}
              >
                <ResultPanel
                  recommendation={state.data.recommendation}
                  userLat={userLat}
                  userLng={userLng}
                  locationName={locationName}
                  onReset={handleReset}
                />
              </div>
            </div>
          )}

          {/* ── ERROR ─────────────────────────────────────── */}
          {phase === "error" && state.status === "error" && (
            <div className="anim-scale-in">
              <div
                className="glass"
                style={{
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "var(--color-negative-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="var(--color-negative)" strokeWidth="1.3" />
                    <path d="M8 5v3.5" stroke="var(--color-negative)" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.75" fill="var(--color-negative)" />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "17px",
                    color: "var(--color-ink)",
                    marginBottom: "8px",
                  }}
                >
                  Analysis failed
                </div>
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "13px",
                    color: "var(--color-ink-3)",
                    lineHeight: 1.6,
                    marginBottom: "18px",
                  }}
                >
                  {state.message}
                </div>
                <button
                  onClick={handleSearch}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--color-navy-900)",
                    color: "white",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM HINT (idle only) ───────────────────────── */}
        {phase === "idle" && (
          <div
            className="anim-fade-in d-3"
            style={{
              position: "absolute",
              bottom: "32px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            <div
              className="glass"
              style={{
                borderRadius: "99px",
                padding: "8px 18px",
                boxShadow: "0 4px 20px rgba(10,22,40,0.1)",
              }}
            >
              <span
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "13px",
                  color: "var(--color-ink-3)",
                  whiteSpace: "nowrap",
                }}
              >
                8 candidate zones across Shenzhen
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <HowItWorks data={state.status === "success" ? state.data : undefined} />
    </div>
  );
}
