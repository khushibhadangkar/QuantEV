"use client";

interface HeroProps {
  onRunClick: () => void;
  onExploreClick: () => void;
}

export function Hero({ onRunClick, onExploreClick }: HeroProps) {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        minHeight: "92vh",
        paddingTop: "80px",
        background: "var(--color-white)",
      }}
    >
      {/* Very subtle radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(210,228,248,0.35) 0%, transparent 70%)",
        }}
      />

      {/* Thin horizontal rule accent */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: "var(--color-border-subtle)" }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 flex flex-col items-center gap-8">
        {/* Eyebrow */}
        <div
          className="anim-fade-up d-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{
            background: "var(--color-navy-50)",
            border: "1px solid var(--color-navy-100)",
            fontFamily: "Times New Roman, Times, serif",
            fontSize: "12px",
            letterSpacing: "0.08em",
            color: "var(--color-navy-600)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--color-navy-500)",
              display: "inline-block",
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
          Quantum-Powered Infrastructure Planning
        </div>

        {/* Headline */}
        <h1
          className="anim-fade-up d-1"
          style={{
            fontFamily: "Times New Roman, Times, serif",
            fontSize: "clamp(42px, 7vw, 76px)",
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: "var(--color-ink)",
            margin: 0,
          }}
        >
          Find where the next
          <br />
          <span style={{ color: "var(--color-navy-700)", fontStyle: "italic" }}>
            charging stations
          </span>
          <br />
          should go.
        </h1>

        {/* Supporting text */}
        <p
          className="anim-fade-up d-2 max-w-xl"
          style={{
            fontFamily: "Times New Roman, Times, serif",
            fontSize: "18px",
            lineHeight: 1.65,
            color: "var(--color-ink-3)",
            margin: 0,
          }}
        >
          QuantEV combines AI-powered demand prediction with quantum optimization
          to pinpoint exactly where EV charging infrastructure will have the greatest impact.
        </p>

        {/* CTAs */}
        <div className="anim-fade-up d-3 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onRunClick}
            style={{
              fontFamily: "Times New Roman, Times, serif",
              fontSize: "17px",
              fontWeight: 400,
              background: "var(--color-navy-900)",
              color: "white",
              border: "none",
              borderRadius: "14px",
              padding: "14px 36px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 24px rgba(10,22,40,0.18)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(10,22,40,0.24)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(10,22,40,0.18)";
            }}
          >
            Run Optimization
          </button>

          <button
            onClick={onExploreClick}
            style={{
              fontFamily: "Times New Roman, Times, serif",
              fontSize: "16px",
              color: "var(--color-ink-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "14px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-ink)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-ink-3)")}
          >
            Explore the zones
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scroll hint */}
        <div
          className="anim-fade-up d-5 absolute bottom-10 flex flex-col items-center gap-2"
          style={{ color: "var(--color-ink-4)" }}
        >
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, var(--color-ink-4), transparent)",
            }}
          />
          <span style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", letterSpacing: "0.1em" }}>
            SCROLL
          </span>
        </div>
      </div>
    </section>
  );
}
