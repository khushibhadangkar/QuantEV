"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { id: "area",    label: "Identifying planning area…",        duration: 600 },
  { id: "demand",  label: "Analysing predicted EV demand…",    duration: 3000 },
  { id: "coverage", label: "Evaluating coverage and reach…",   duration: 5000 },
  { id: "optimal", label: "Identifying optimal locations…",    duration: 60000 },
];

export function SearchProgress() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let t = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STEPS.length; i++) {
      t += STEPS[i - 1].duration;
      const delay = t;
      timers.push(
        setTimeout(() => setStepIndex(i), delay)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="anim-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "18px 22px",
      }}
    >
      {STEPS.map((step, i) => {
        const isActive = i === stepIndex;
        const isDone = i < stepIndex;

        return (
          <div
            key={step.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: i > stepIndex ? 0.3 : 1,
              transition: "opacity 0.35s ease",
            }}
          >
            {/* Indicator */}
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                flexShrink: 0,
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
                  ? "1.5px solid var(--color-navy-400)"
                  : "1.5px solid var(--color-border)",
                transition: "all 0.3s ease",
              }}
            >
              {isDone ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M1.5 4l2 2 3-3"
                    stroke="white"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : isActive ? (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    border: "1.5px solid var(--color-navy-500)",
                    borderTopColor: "transparent",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "var(--color-grey-300)",
                  }}
                />
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: "Times New Roman, serif",
                fontSize: "14px",
                color: isDone
                  ? "var(--color-ink-4)"
                  : isActive
                  ? "var(--color-ink)"
                  : "var(--color-ink-4)",
                transition: "color 0.3s ease",
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
