"use client";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        background: "var(--color-white)",
      }}
    >
      <div className="anim-scale-up" style={{ maxWidth: "400px" }}>
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "var(--color-negative-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle
              cx="11"
              cy="11"
              r="9.5"
              stroke="var(--color-negative)"
              strokeWidth="1.5"
            />
            <path
              d="M11 7v5"
              stroke="var(--color-negative)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="11" cy="15.5" r="0.75" fill="var(--color-negative)" />
          </svg>
        </div>

        <h3
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "24px",
            fontWeight: 400,
            color: "var(--color-ink)",
            letterSpacing: "-0.015em",
            marginBottom: "12px",
          }}
        >
          Optimisation failed
        </h3>

        <p
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "15px",
            color: "var(--color-ink-3)",
            lineHeight: 1.65,
            marginBottom: "32px",
          }}
        >
          {message}
        </p>

        <button
          onClick={onRetry}
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "15px",
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
          Try again
        </button>
      </div>
    </section>
  );
}
