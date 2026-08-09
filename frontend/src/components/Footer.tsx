export function Footer() {
  return (
    <footer
      style={{
        padding: "48px 32px",
        borderTop: "1px solid var(--color-border-subtle)",
        background: "var(--color-white)",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "var(--color-navy-900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="1.8" fill="white" />
              <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="0.7" fill="none" opacity="0.4" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "Times New Roman, serif",
              fontSize: "14px",
              color: "var(--color-ink-3)",
            }}
          >
            QuantEV
          </span>
        </div>

        <p
          style={{
            fontFamily: "Times New Roman, serif",
            fontSize: "13px",
            color: "var(--color-ink-4)",
          }}
        >
          AI demand prediction · QUBO · QAOA · Aer Simulator
        </p>
      </div>
    </footer>
  );
}
