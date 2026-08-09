"use client";

import { useState } from "react";
import { Settings2, ChevronDown, ChevronUp } from "lucide-react";
import type { OptimizeRequest } from "@/types/api";

interface RunControlsProps {
  onRun: (params: OptimizeRequest) => void;
  isLoading: boolean;
}

/**
 * Advanced parameter controls for the optimize pipeline.
 * Pass onRun to wire up the Run button with custom reps/shots/seed.
 */
export function RunControls({ onRun, isLoading }: RunControlsProps) {
  const [open, setOpen] = useState(false);
  const [reps, setReps] = useState(1);
  const [shots, setShots] = useState(2048);
  const [seed, setSeed] = useState(42);

  const handleRun = () => onRun({ reps, shots, seed });

  return (
    <div className="card p-4 flex flex-col gap-3 animate-fade-in">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--color-text-secondary)" }}
        aria-expanded={open}
      >
        <Settings2 size={13} />
        Advanced parameters
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="animate-fade-in grid grid-cols-3 gap-3 pt-1">
          {(
            [
              { label: "Reps (p)", value: reps, min: 1, max: 5, set: setReps },
              { label: "Shots", value: shots, min: 128, max: 16384, set: setShots },
              { label: "Seed", value: seed, min: 0, max: 99999, set: setSeed },
            ] as const
          ).map(({ label, value, min, max, set }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {label}
              </label>
              <input
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium outline-none transition-all"
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          ))}

          <div className="col-span-3 flex justify-end">
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                background: "var(--color-navy-900)",
                color: "#fff",
              }}
            >
              {isLoading ? "Running…" : "Run with these settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
