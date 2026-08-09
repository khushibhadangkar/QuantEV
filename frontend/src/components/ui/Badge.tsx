import { type ReactNode } from "react";

type BadgeVariant = "navy" | "success" | "warning" | "neutral" | "glass";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  navy:    "bg-[var(--color-navy-100)] text-[var(--color-navy-800)] border border-[var(--color-navy-200)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-emerald-200",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-amber-200",
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
  glass:   "glass text-[var(--color-text-secondary)]",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px] tracking-wide",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase leading-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
