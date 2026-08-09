"use client";

interface NavbarProps {
  onRunClick: () => void;
  isLoading: boolean;
  hasResult: boolean;
  onReset: () => void;
}

export function Navbar({ onRunClick, isLoading, hasResult, onReset }: NavbarProps) {
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 glass"
      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <a href="#" className="flex items-center gap-3 no-underline">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-navy-900)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white" />
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
              <circle cx="7" cy="7" r="7" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "Times New Roman, Times, serif",
              fontSize: "17px",
              fontWeight: 400,
              color: "var(--color-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            QuantEV
          </span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {hasResult && (
            <button
              onClick={onReset}
              style={{
                fontFamily: "Times New Roman, Times, serif",
                fontSize: "14px",
                color: "var(--color-ink-3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "8px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-ink)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-ink-3)")}
            >
              Reset
            </button>
          )}
          <button
            onClick={onRunClick}
            disabled={isLoading}
            style={{
              fontFamily: "Times New Roman, Times, serif",
              fontSize: "14px",
              fontWeight: 400,
              background: isLoading ? "var(--color-navy-700)" : "var(--color-navy-900)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "8px 20px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.2s ease, transform 0.15s ease",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => {
              if (!isLoading) e.currentTarget.style.background = "var(--color-navy-700)";
            }}
            onMouseLeave={e => {
              if (!isLoading) e.currentTarget.style.background = "var(--color-navy-900)";
            }}
          >
            {isLoading ? "Running…" : "Run Optimization"}
          </button>
        </div>
      </div>
    </header>
  );
}
