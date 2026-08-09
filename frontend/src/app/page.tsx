"use client";

import { useRef } from "react";
import { useOptimize } from "@/hooks/useOptimize";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { MapSection } from "@/components/MapSection";
import { OptimizationProgress } from "@/components/OptimizationProgress";
import { ResultHero } from "@/components/ResultHero";
import { WhySection } from "@/components/WhySection";
import { TechnicalSection } from "@/components/TechnicalSection";
import { ErrorState } from "@/components/ErrorState";
import { Footer } from "@/components/Footer";

// Static candidate zone stubs for the pre-run map display.
// Coordinates match the API response exactly (from backend candidate_zones.csv).
// Demand values are 0 because we haven't run the model yet — they are replaced
// by the real API response after optimization completes.
const CANDIDATE_ZONE_STUBS = [
  { label: "Z0", tazid: 1026, longitude: 114.080807, latitude: 22.634883, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z1", tazid: 746,  longitude: 114.072886, latitude: 22.623009, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z2", tazid: 716,  longitude: 114.073896, latitude: 22.609345, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z3", tazid: 965,  longitude: 114.098666, latitude: 22.616885, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z4", tazid: 706,  longitude: 114.054821, latitude: 22.633648, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z5", tazid: 745,  longitude: 114.060543, latitude: 22.621869, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z6", tazid: 744,  longitude: 114.068025, latitude: 22.649986, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
  { label: "Z7", tazid: 737,  longitude: 114.084390, latitude: 22.652124, predicted_demand_kwh_h: 0, qubo_c_value: 0, selected: false },
];

export default function Page() {
  const { state, run, reset } = useOptimize();
  const mapRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";

  function handleExploreClick() {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleRunClick() {
    run();
    // Small delay so the loading state renders before scrolling
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-white)" }}>
      <Navbar
        onRunClick={handleRunClick}
        isLoading={isLoading}
        hasResult={isSuccess}
        onReset={reset}
      />

      {/* ── IDLE / PRE-RUN ──────────────────────────────────────── */}
      {state.status === "idle" && (
        <>
          <Hero onRunClick={handleRunClick} onExploreClick={handleExploreClick} />

          {/* Pre-run map showing candidate locations */}
          <div ref={mapRef} id="zones">
            <MapSection
              zoneDetails={CANDIDATE_ZONE_STUBS}
              selectedZones={[]}
              isResult={false}
              title="Eight candidate zones across Shenzhen"
              subtitle="Click a pin to explore a zone. Run the optimisation to see recommendations."
            />
          </div>

          {/* Teaser section — what QuantEV does */}
          <section
            style={{
              padding: "100px 0",
              background: "var(--color-fog)",
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
                alignItems: "center",
              }}
              className="teaser-grid"
            >
              <div>
                <p
                  className="anim-fade-up d-0"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "12px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-4)",
                    marginBottom: "16px",
                  }}
                >
                  The approach
                </p>
                <h2
                  className="anim-fade-up d-1"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "clamp(28px, 3vw, 42px)",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--color-ink)",
                    marginBottom: "24px",
                    lineHeight: 1.15,
                  }}
                >
                  Infrastructure planning,
                  <br />
                  <em>reimagined.</em>
                </h2>
                <p
                  className="anim-fade-up d-2"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "16px",
                    color: "var(--color-ink-3)",
                    lineHeight: 1.7,
                    marginBottom: "32px",
                  }}
                >
                  Traditional site selection relies on gut feel and spreadsheets.
                  QuantEV uses real charging demand data, AI forecasting, and a
                  quantum optimisation algorithm to make that decision objectively —
                  in seconds.
                </p>
                <button
                  onClick={handleRunClick}
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "16px",
                    background: "var(--color-navy-900)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 28px",
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  Run the optimisation →
                </button>
              </div>

              <div
                className="anim-fade-up d-2"
                style={{ display: "flex", flexDirection: "column", gap: "0" }}
              >
                {[
                  {
                    num: "01",
                    title: "AI demand prediction",
                    body:
                      "Historical EV charging patterns train a model that forecasts demand for each candidate location.",
                  },
                  {
                    num: "02",
                    title: "Quantum optimisation",
                    body:
                      "The placement problem is solved using QAOA — a quantum algorithm that finds the globally optimal configuration.",
                  },
                  {
                    num: "03",
                    title: "Clear recommendation",
                    body:
                      "You see exactly which zones to build in, ranked by predicted impact, on a real map.",
                  },
                ].map(({ num, title, body }, i) => (
                  <div
                    key={num}
                    style={{
                      display: "flex",
                      gap: "20px",
                      padding: "24px 0",
                      borderBottom:
                        i < 2
                          ? "1px solid var(--color-border-subtle)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Times New Roman, serif",
                        fontSize: "13px",
                        color: "var(--color-ink-4)",
                        minWidth: "28px",
                        paddingTop: "2px",
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
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontSize: "14px",
                          color: "var(--color-ink-3)",
                          lineHeight: 1.65,
                        }}
                      >
                        {body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <style>{`
            @media (max-width: 768px) {
              .teaser-grid {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
            }
          `}</style>

          <Footer />
        </>
      )}

      {/* ── LOADING ─────────────────────────────────────────────── */}
      {state.status === "loading" && (
        <>
          <div style={{ paddingTop: "64px" }}>
            <OptimizationProgress />
          </div>
          <Footer />
        </>
      )}

      {/* ── ERROR ───────────────────────────────────────────────── */}
      {state.status === "error" && (
        <>
          <div style={{ paddingTop: "64px" }}>
            <ErrorState message={state.message} onRetry={run} />
          </div>
          <Footer />
        </>
      )}

      {/* ── SUCCESS / RESULT ────────────────────────────────────── */}
      {state.status === "success" && (
        <>
          <div ref={resultRef} style={{ paddingTop: "64px" }}>
            {/* 1. Result statement */}
            <ResultHero
              recommendation={state.data.recommendation}
              pipelineRuntime={state.data.pipeline_runtime_s}
            />

            {/* 2. Map — focused on recommended zones */}
            <MapSection
              zoneDetails={state.data.recommendation.zone_details}
              selectedZones={state.data.recommendation.selected_zones}
              isResult={true}
              title="Recommended charging locations"
              subtitle="The optimiser identified these three zones as the highest-impact placement across Shenzhen."
            />

            {/* 3. Why these locations + demand chart */}
            <WhySection
              recommendation={state.data.recommendation}
              demandPrediction={state.data.demand_prediction}
            />

            {/* 4. Technical pipeline details */}
            <TechnicalSection data={state.data} />
          </div>
          <Footer />
        </>
      )}
    </div>
  );
}
