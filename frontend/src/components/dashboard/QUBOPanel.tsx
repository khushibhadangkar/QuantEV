"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import type { QUBOResponse, ClassicalResult, QAOAResult } from "@/types/api";

interface QUBOPanelProps {
  qubo: QUBOResponse;
  classical: ClassicalResult;
  qaoa: QAOAResult;
}

export function QUBOPanel({ qubo, classical, qaoa }: QUBOPanelProps) {
  return (
    <div className="card-elevated p-6 flex flex-col gap-6 animate-fade-in stagger-4">
      <SectionHeader
        title="QUBO & Solver Details"
        subtitle={`${qubo.n_qubits} qubits · budget K=${qubo.budget_k} · λ=${qubo.lambda}`}
      />

      {/* QUBO c-values */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Proximity-weighted coverage (c values)
        </p>
        <div className="flex flex-col gap-1">
          {Object.entries(qubo.c_values)
            .sort(([, a], [, b]) => b - a)
            .map(([zone, c], i) => {
              const max = Math.max(...Object.values(qubo.c_values));
              const pct = (c / max) * 100;
              return (
                <div key={zone} className="flex items-center gap-2.5">
                  <span
                    className="w-6 text-xs font-semibold tabular-nums"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {zone}
                  </span>
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--color-border)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "var(--color-navy-400)",
                        transform: "scaleX(0)",
                        transformOrigin: "left",
                        animation: `bar-grow 0.5s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.04}s both`,
                      }}
                    />
                  </div>
                  <span
                    className="w-16 text-right text-[11px] font-medium tabular-nums"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {c.toFixed(4)}
                  </span>
                </div>
              );
            })}
        </div>
        <div
          className="mt-2 text-[10px]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Global minimum energy: {qubo.global_minimum_energy.toFixed(4)}
        </div>
      </div>

      <div
        className="h-px"
        style={{ background: "var(--color-border)" }}
      />

      {/* Solver comparison */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Solver comparison
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              name: "Classical",
              method: classical.method,
              energy: classical.qubo_energy,
              zones: classical.selected_zones,
              runtime: classical.runtime_s,
              feasible: classical.feasible,
              extra: `${classical.coverage_pct.toFixed(1)}% coverage`,
            },
            {
              name: "QAOA",
              method: qaoa.method,
              energy: qaoa.qubo_energy,
              zones: qaoa.selected_zones,
              runtime: qaoa.runtime_s,
              feasible: qaoa.feasible,
              extra: `p=${qaoa.reps} · depth ${qaoa.circuit_depth}`,
            },
          ].map((solver) => (
            <div
              key={solver.name}
              className="flex flex-col gap-2.5 p-4 rounded-xl"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {solver.name}
                </span>
                <Badge variant={solver.feasible ? "success" : "warning"} size="sm">
                  {solver.feasible ? "✓" : "!"}
                </Badge>
              </div>

              <div className="flex flex-col gap-1">
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {solver.energy.toFixed(3)}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  QUBO energy
                </span>
              </div>

              <div
                className="flex flex-wrap gap-1"
              >
                {solver.zones.map((z) => (
                  <span
                    key={z}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: "var(--color-navy-100)",
                      color: "var(--color-navy-700)",
                    }}
                  >
                    {z}
                  </span>
                ))}
              </div>

              <div
                className="text-[10px]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {solver.extra} · {solver.runtime < 0.01
                  ? `${(solver.runtime * 1000).toFixed(1)} ms`
                  : `${solver.runtime.toFixed(2)} s`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QAOA extras */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          QAOA circuit details
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: "Qubits", value: qaoa.n_qubits },
            { label: "Depth", value: qaoa.circuit_depth },
            { label: "Reps p", value: qaoa.reps },
            { label: "Shots", value: qaoa.shots.toLocaleString() },
            {
              label: "Success",
              value: `${(qaoa.success_probability * 100).toFixed(2)}%`,
            },
            {
              label: "Δ Energy",
              value: qaoa.energy_gap.toFixed(3),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span
                className="text-[10px] font-medium"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {label}
              </span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: "var(--color-text-primary)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {qaoa.matches_qubo_optimum && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{
              background: "var(--color-success-bg)",
              color: "var(--color-success)",
              border: "1px solid rgba(26,158,94,0.15)",
            }}
          >
            <span>◆</span>
            QAOA found the QUBO global optimum
          </div>
        )}
      </div>
    </div>
  );
}
