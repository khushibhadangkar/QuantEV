"use client";

import { Zap } from "lucide-react";

interface IdleStateProps {
  onRun: () => void;
  isLoading?: boolean;
}

export function IdleState({ onRun, isLoading }: IdleStateProps) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center gap-8 py-24 text-center">
      {/* Abstract quantum illustration */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
          {/* Outer orbit ring */}
          <ellipse
            cx="64" cy="64" rx="56" ry="22"
            stroke="var(--color-navy-200)" strokeWidth="1"
            strokeDasharray="4 3"
            className="animate-spin-slow"
            style={{ transformOrigin: "64px 64px", animationDuration: "12s" }}
          />
          {/* Inner orbit ring — tilted */}
          <ellipse
            cx="64" cy="64" rx="38" ry="56"
            stroke="var(--color-navy-200)" strokeWidth="1"
            strokeDasharray="4 3"
            style={{ transform: "rotate(30deg)", transformOrigin: "64px 64px" }}
            className="animate-spin-slow"
          />
          {/* Center node */}
          <circle
            cx="64" cy="64" r="10"
            fill="var(--color-navy-900)"
          />
          <circle
            cx="64" cy="64" r="5"
            fill="var(--color-navy-400)"
            className="animate-pulse-soft"
          />
          {/* Orbit dots */}
          <circle cx="120" cy="64" r="3.5" fill="var(--color-navy-400)" className="animate-pulse-soft stagger-2" />
          <circle cx="8"   cy="64" r="3.5" fill="var(--color-navy-300)" className="animate-pulse-soft stagger-4" />
          <circle cx="64"  cy="8"  r="3"   fill="var(--color-navy-300)" className="animate-pulse-soft stagger-3" />
          <circle cx="64"  cy="120" r="3"  fill="var(--color-navy-200)" className="animate-pulse-soft stagger-6" />
        </svg>
      </div>

      <div className="max-w-md">
        <h2
          className="text-3xl font-light tracking-tight mb-3"
          style={{ color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}
        >
          Quantum EV Optimizer
        </h2>
        <p
          className="text-base leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          AI demand prediction meets quantum annealing. Run the pipeline to
          identify the optimal EV charging station locations across all candidate zones.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onRun}
          disabled={isLoading}
          className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-navy-900)",
            color: "var(--color-text-inverse)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Zap
            size={16}
            className="group-hover:scale-110 transition-transform duration-200"
          />
          Run Optimization
        </button>
        <p
          className="text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          AI → QUBO → QAOA · Aer Simulator · ~30–90 s
        </p>
      </div>
    </div>
  );
}
