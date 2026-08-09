import { type ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  className?: string;
  animClass?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  icon,
  accent = false,
  className = "",
  animClass = "",
}: MetricCardProps) {
  return (
    <div
      className={`card p-5 flex flex-col gap-3 transition-shadow duration-300 hover:shadow-[var(--shadow-md)] ${accent ? "border-[var(--color-navy-200)]" : ""} ${animClass} ${className}`}
    >
      <div className="flex items-start justify-between">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </p>
        {icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--color-navy-50)",
              color: "var(--color-navy-500)",
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <div
          className="text-2xl font-semibold tracking-tight leading-none"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </div>
        {sub && (
          <div
            className="mt-1.5 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
