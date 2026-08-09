"use client";

import { useEffect, useState } from "react";

const STAGES = [
  {
    id: "demand",
    label: "Analysing demand",
    detail: "Processing historical EV charging patterns across 8 zones",
    duration: 8000,
  },
  {
    id: "qubo",
    label: "Building optimisation model",
    detail: "Encoding placement constraints into a quantum-ready QUBO matrix",
    duration: 10000,
  },
  {
    id: "qaoa",
    label: "Running QAOA",
    detail: "Executing Quantum Approximate Optimisation on Aer simulator",
    duration: 60000,
  },
  {
    id: "result",
    label: "Finding best locations",
    detail: "Evaluating all feasible solutions for highest-impact placement",
    duration: 5000,
  },
];

export function OptimizationProgress() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Advance stages on a rough timer (display only — real progress is unknown)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cumulative = STAGES.slice(0, activeIndex + 1).reduce(
      (s, st) => s + st.duration / 1000,
      0
    );
    if (elapsed >= cumulative && activeIndex < STAGES.length - 1) {
      setActiveIndex((i) => i + 1);
    }
  }, [elapsed, activeIndex]);

  return (
    <section
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        background: "var(--color-white)",
      }}
    >
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
        {/* Animated orbital graphic */}
        <div
          className="anim-fade-in"
          style={{ marginBottom: "48px", display: "flex", justifyContent: "center" }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="6" fill="var(--color-navy-800)" />
            <circle
              cx="40"
              cy="40"
              r="18"
              stroke="var(--color-navy-200)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="3 4"
              style={{ transformOrigin: "40px 40px", animation: "spin 6s linear infinite" }}
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke="var(--color-navy-100)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 5"
              style={{
                transformOrigin: "40px 40px",
                animation: "spin 10s linear infinite reverse",
              }}
            />
            {/* Orbiting dot */}
            <circle r="4" fill="var(--color-navy-500)">
              <animateMotion dur="6s" repeatCount="indefinite">
                <mpath href="#orbit-path" />
              </animateMotion>
            </circle>
            <circle r="2.5" fill="var(--color-navy-300)" opacity="0.7">
              <animateMotion dur="10s" repeatCount="indefinite">
                <mpath href="#orbit-path-outer" />
              </animateMotion>
            </circle>
            <path
              id="orbit-path"
              d="M 40 22 A 18 18 0 1 1 39.99 22"
              fill="none"
            />
            <path
              id="orbit-path-outer"
              d="M 40 10 A 30 30 0 1 0 39.99 10"
              fill="none"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2
          className="anim-fade-up d-1"
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: "var(--color-ink)",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          Optimising your network
        </h2>
        <p
          className="anim-fade-up d-2"
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "15px",
            color: "var(--color-ink-3)",
            marginBottom: "48px",
            lineHeight: 1.6,
          }}
        >
          This typically takes 30–90 seconds
        </p>

        {/* Stage list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0", textAlign: "left" }}>
          {STAGES.map((stage, i) => {
            const isDone = i < activeIndex;
            const isActive = i === activeIndex;

            return (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "14px 0",
                  borderBottom:
                    i < STAGES.length - 1
                      ? "1px solid var(--color-border-subtle)"
                      : "none",
                  opacity: i > activeIndex ? 0.35 : 1,
                  transition: "opacity 0.4s ease",
                  animation: isActive ? "step-enter 0.4s ease both" : "none",
                }}
              >
                {/* Status indicator */}
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "var(--color-navy-900)"
                      : isActive
                      ? "transparent"
                      : "transparent",
                    border: isDone
                      ? "none"
                      : isActive
                      ? "2px solid var(--color-navy-400)"
                      : "2px solid var(--color-border)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5 3.5-4"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isActive ? (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "transparent",
                        borderTop: "2px solid var(--color-navy-500)",
                        borderRight: "2px solid transparent",
                        borderBottom: "2px solid transparent",
                        borderLeft: "2px solid transparent",
                        boxSizing: "border-box",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--color-border)",
                      }}
                    />
                  )}
                </div>

                {/* Text */}
                <div>
                  <div
                    style={{
                      fontFamily: "Times New Roman, serif",
                      fontSize: "15px",
                      color: isDone
                        ? "var(--color-ink-3)"
                        : isActive
                        ? "var(--color-ink)"
                        : "var(--color-ink-3)",
                      marginBottom: "2px",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {stage.label}
                  </div>
                  {isActive && (
                    <div
                      style={{
                        fontFamily: "Times New Roman, serif",
                        fontSize: "13px",
                        color: "var(--color-ink-4)",
                        animation: "fade-in 0.3s ease both",
                        lineHeight: 1.5,
                      }}
                    >
                      {stage.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Elapsed */}
        <p
          style={{
            marginTop: "28px",
            fontFamily: "Times New Roman, serif",
            fontSize: "13px",
            color: "var(--color-ink-4)",
          }}
        >
          {elapsed}s elapsed
        </p>
      </div>
    </section>
  );
}
