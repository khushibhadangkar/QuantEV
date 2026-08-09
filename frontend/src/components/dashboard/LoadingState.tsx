"use client";

export function LoadingState() {
  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>

      {/* Hero skeleton */}
      <div className="skeleton rounded-2xl" style={{ height: 220 }} />

      {/* Metric row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: 110 }} />
        ))}
      </div>

      {/* Two-col */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="skeleton rounded-2xl" style={{ height: 320 }} />
        <div className="skeleton rounded-2xl" style={{ height: 320 }} />
      </div>

      {/* Status text */}
      <div className="flex items-center justify-center gap-3 py-4">
        <svg
          className="animate-spin-slow"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-navy-400)" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span
          className="text-sm font-medium animate-pulse-soft"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Running AI prediction · QUBO construction · QAOA optimization…
        </span>
      </div>
    </div>
  );
}
