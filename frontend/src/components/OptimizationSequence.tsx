"use client";

import { useEffect, useState } from "react";

const STAGES = [
  {
    id: "demand",
    label: "Forecasting EV demand",
    detail: "Applying AI model across 8 candidate zones",
    icon: "demand",
    mapAction: "Plotting predicted demand heatmap…",
  },
  {
    id: "gaps",
    label: "Detecting coverage gaps",
    detail: "Identifying underserved areas in the network",
    icon: "scan",
    mapAction: "Scanning for infrastructure gaps…",
  },
  {
    id: "eval",
    label: "Evaluating candidate sites",
    detail: "Scoring each zone by demand, coverage and proximity",
    icon: "eval",
    mapAction: "Evaluating 8 candidate locations…",
  },
  {
    id: "qaoa",
    label: "Running QAOA optimisation",
    detail: "Quantum algorithm solving the placement problem",
    icon: "quantum",
    mapAction: "Quantum circuit executing…",
  },
  {
    id: "result",
    label: "Building final recommendation",
    detail: "Selecting the globally optimal station placement",
    icon: "check",
    mapAction: "Finalising infrastructure plan…",
  },
];

// Durations for display-only advancement (actual API drives real timing)
const STAGE_DURATIONS = [2200, 3500, 5000, 60000, 3000];

interface OptimizationSequenceProps {
  currentStep?: number; // externally driven step (0-4)
}

export function OptimizationSequence({ currentStep }: OptimizationSequenceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = currentStep ?? stepIndex;

  // Self-advance if no external step provided
  useEffect(() => {
    if (currentStep !== undefined) return;
    let t = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STAGES.length; i++) {
      t += STAGE_DURATIONS[i - 1];
      const delay = t;
      timers.push(setTimeout(() => setStepIndex(i), delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [currentStep]);

  return (
    <div className="anim-slide-up" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "4px" }}>
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: "4px" }}>
          Infrastructure analysis
        </div>
        <div style={{ fontFamily: "Times New Roman, serif", fontSize: "16px", color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
          Optimising station placement…
        </div>
      </div>

      {STAGES.map((stage, i) => {
        const isActive = i === activeStep;
        const isDone = i < activeStep;
        const isFuture = i > activeStep;

        return (
          <div
            key={stage.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "8px 0",
              borderBottom: i < STAGES.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
              opacity: isFuture ? 0.32 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            {/* Step indicator */}
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                flexShrink: 0,
                marginTop: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDone ? "var(--color-navy-900)" : "transparent",
                border: isDone ? "none" : isActive ? "1.5px solid var(--color-navy-400)" : "1.5px solid var(--color-border)",
                transition: "all 0.3s ease",
              }}
            >
              {isDone ? (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : isActive ? (
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1.5px solid var(--color-navy-500)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              ) : (
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--color-grey-300)" }} />
              )}
            </div>

            {/* Label + detail */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Times New Roman, serif", fontSize: "13px", color: isDone ? "var(--color-ink-4)" : isActive ? "var(--color-ink)" : "var(--color-ink-4)", transition: "color 0.3s ease", lineHeight: 1.3 }}>
                {stage.label}
              </div>
              {isActive && (
                <div
                  className="anim-fade-in"
                  style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", color: "var(--color-ink-4)", marginTop: "2px", lineHeight: 1.4 }}
                >
                  {stage.detail}
                </div>
              )}
            </div>

            {/* Map action tag — only active */}
            {isActive && (
              <div
                className="anim-fade-in"
                style={{
                  flexShrink: 0,
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "var(--color-navy-50)",
                  border: "1px solid var(--color-navy-100)",
                  fontFamily: "Times New Roman, serif",
                  fontSize: "10px",
                  color: "var(--color-navy-600)",
                  whiteSpace: "nowrap",
                  marginTop: "1px",
                }}
              >
                {stage.mapAction}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
