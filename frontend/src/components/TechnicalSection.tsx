"use client";

import { useState } from "react";
import type { OptimizeResponse } from "@/types/api";

interface TechnicalSectionProps {
  data: OptimizeResponse;
}

function formatMethod(s: string): string {
  if (s === "qaoa_aer_simulator") return "QAOA · Aer Simulator";
  if (s === "classical_exhaustive") return "Classical · Exhaustive";
  return s.replace(/_/g, " ");
}

export function TechnicalSection({ data }: TechnicalSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const { qubo, qaoa, classical, demand_prediction } = data;

  return (
    <section
      style={{
        padding: "100px 0",
        background: "var(--color-fog)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px" }}>
        {/* Header */}
        <div className="anim-fade-up d-0" style={{ marginBottom: "60px" }}>
          <p
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-4)",
              marginBottom: "16px",
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
              marginBottom: "16px",
              lineHeight: 1.15,
            }}
          >
            Behind the optimisation
          </h2>
          <p
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "16px",
              color: "var(--color-ink-3)",
              maxWidth: "500px",
              lineHeight: 1.65,
            }}
          >
            Three stages transform raw charging data into a precise infrastructure recommendation.
          </p>
        </div>

        {/* Pipeline steps */}
        <div
          className="anim-fade-up d-1"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "var(--color-border)",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            marginBottom: "48px",
          }}
        >
          {[
            {
              num: "01",
              title: "AI Demand Prediction",
              body: `A Random Forest model trained on ${demand_prediction.test_split_start.slice(0, 7)}–${demand_prediction.test_split_end.slice(0, 7)} charging data predicts hourly electricity demand for each candidate zone.`,
              stat: demand_prediction.test_r2 != null
                ? `R² ${demand_prediction.test_r2.toFixed(3)}`
                : "Prediction model",
              statSub: demand_prediction.model.replace("Regressor", ""),
            },
            {
              num: "02",
              title: "QUBO Formulation",
              body: `The placement problem is encoded as a Quadratic Unconstrained Binary Optimisation (QUBO) — a mathematical form that quantum computers can process directly.`,
              stat: `${qubo.n_qubits} qubits`,
              statSub: `K=${qubo.budget_k} stations · λ=${qubo.lambda}`,
            },
            {
              num: "03",
              title: "QAOA Solver",
              body: `The Quantum Approximate Optimisation Algorithm explores the solution space by preparing quantum states that encode the best placements.`,
              stat: `${qaoa.runtime_s.toFixed(1)}s`,
              statSub: `depth ${qaoa.circuit_depth} · ${qaoa.shots.toLocaleString()} shots`,
            },
          ].map(({ num, title, body, stat, statSub }, i) => (
            <div
              key={num}
              style={{
                background: "var(--color-white)",
                padding: "32px 28px",
              }}
            >
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "12px",
                  color: "var(--color-ink-4)",
                  letterSpacing: "0.06em",
                  marginBottom: "16px",
                }}
              >
                {num}
              </div>
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "18px",
                  color: "var(--color-ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: "12px",
                  lineHeight: 1.3,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "13px",
                  color: "var(--color-ink-3)",
                  lineHeight: 1.7,
                  marginBottom: "20px",
                }}
              >
                {body}
              </div>
              {/* Mini stat */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border-subtle)",
                  paddingTop: "16px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "22px",
                    fontWeight: 400,
                    color: "var(--color-navy-800)",
                    letterSpacing: "-0.02em",
                    marginBottom: "2px",
                  }}
                >
                  {stat}
                </div>
                <div
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "11px",
                    color: "var(--color-ink-4)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {statSub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expandable technical details */}
        <div className="anim-fade-up d-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "12px 20px",
              cursor: "pointer",
              fontFamily: "Times New Roman, serif",
              fontSize: "14px",
              color: "var(--color-ink-3)",
              transition: "all 0.2s ease",
              width: "100%",
              justifyContent: "space-between",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-navy-300)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <span>Technical details</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
              }}
            >
              <path
                d="M2 4.5l5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {expanded && (
            <div
              className="anim-slide-down"
              style={{
                marginTop: "2px",
                background: "var(--color-white)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* QUBO details */}
              <div
                style={{
                  padding: "28px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-4)",
                    marginBottom: "16px",
                  }}
                >
                  QUBO parameters
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {[
                    { label: "Qubits", value: qubo.n_qubits },
                    { label: "Budget K", value: qubo.budget_k },
                    { label: "Penalty λ", value: qubo.lambda },
                    {
                      label: "Global minimum",
                      value: qubo.global_minimum_energy.toFixed(3),
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontSize: "11px",
                          color: "var(--color-ink-4)",
                          marginBottom: "4px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontSize: "20px",
                          color: "var(--color-ink)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QAOA details */}
              <div
                style={{
                  padding: "28px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-4)",
                    marginBottom: "16px",
                  }}
                >
                  QAOA results
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    { label: "Reps (p)", value: qaoa.reps },
                    { label: "Circuit depth", value: qaoa.circuit_depth },
                    { label: "Shots", value: qaoa.shots.toLocaleString() },
                    {
                      label: "Success prob.",
                      value: `${(qaoa.success_probability * 100).toFixed(2)}%`,
                    },
                    {
                      label: "QUBO energy",
                      value: qaoa.qubo_energy.toFixed(3),
                    },
                    {
                      label: "Δ from optimum",
                      value: qaoa.energy_gap.toFixed(3),
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontSize: "11px",
                          color: "var(--color-ink-4)",
                          marginBottom: "4px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontSize: "18px",
                          color: "var(--color-ink)",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                {qaoa.matches_qubo_optimum && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "var(--color-positive-bg)",
                      border: "1px solid rgba(15,122,74,0.15)",
                      fontFamily: "Times New Roman, serif",
                      fontSize: "13px",
                      color: "var(--color-positive)",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    QAOA reached the global QUBO optimum
                  </div>
                )}
              </div>

              {/* Classical comparison */}
              <div style={{ padding: "28px" }}>
                <p
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-4)",
                    marginBottom: "16px",
                  }}
                >
                  Classical benchmark
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      name: "Classical",
                      method: formatMethod(classical.method),
                      zones: classical.selected_zones.join(", "),
                      energy: classical.qubo_energy.toFixed(3),
                      runtime: `${classical.runtime_s < 0.01
                        ? `${(classical.runtime_s * 1000).toFixed(1)} ms`
                        : `${classical.runtime_s.toFixed(3)} s`}`,
                    },
                    {
                      name: "QAOA",
                      method: formatMethod(qaoa.method),
                      zones: qaoa.selected_zones.join(", "),
                      energy: qaoa.qubo_energy.toFixed(3),
                      runtime: `${qaoa.runtime_s.toFixed(1)} s`,
                    },
                  ].map((solver) => (
                    <div
                      key={solver.name}
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        background: "var(--color-grey-50)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontSize: "16px",
                          color: "var(--color-ink)",
                          marginBottom: "12px",
                        }}
                      >
                        {solver.name}
                      </div>
                      {[
                        { k: "Method", v: solver.method },
                        { k: "Zones", v: solver.zones },
                        { k: "Energy", v: solver.energy },
                        { k: "Runtime", v: solver.runtime },
                      ].map(({ k, v }) => (
                        <div
                          key={k}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid var(--color-border-subtle)",
                            fontFamily: "Times New Roman, serif",
                            fontSize: "13px",
                          }}
                        >
                          <span style={{ color: "var(--color-ink-4)" }}>{k}</span>
                          <span style={{ color: "var(--color-ink-2)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          [style*="gridTemplateColumns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          [style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
