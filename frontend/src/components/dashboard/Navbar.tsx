"use client";

import { Zap, RefreshCw } from "lucide-react";

interface NavbarProps {
  onRun: () => void;
  onReset?: () => void;
  isLoading: boolean;
  hasResult: boolean;
}

export function Navbar({ onRun, onReset, isLoading, hasResult }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 w-full glass"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="mx-auto max-w-7xl px-6 flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-navy-900)" }}
          >
            <Zap size={13} style={{ color: "rgba(255,255,255,0.9)" }} strokeWidth={2.5} />
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            QuantEV
          </span>
          <span
            className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
            style={{
              background: "var(--color-navy-50)",
              color: "var(--color-navy-600)",
              border: "1px solid var(--color-navy-200)",
            }}
          >
            Beta
          </span>
        </div>

        {/* Nav links — decorative */}
        <nav className="hidden md:flex items-center gap-6">
          {["Dashboard", "Zones", "History"].map((item, i) => (
            <span
              key={item}
              className="text-xs font-medium cursor-default"
              style={{
                color:
                  i === 0
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
              }}
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasResult && onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:opacity-80"
              style={{
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              Reset
            </button>
          )}
          <button
            onClick={onRun}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--color-navy-900)",
              color: "#fff",
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={12} className="animate-spin-slow" />
                Running…
              </>
            ) : (
              <>
                <Zap size={12} />
                Run
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
