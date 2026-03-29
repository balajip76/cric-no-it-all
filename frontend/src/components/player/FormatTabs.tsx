"use client";

import type { CricketFormat } from "@/types/database.types";

const FORMATS: { label: string; value: CricketFormat }[] = [
  { label: "Test", value: "test" },
  { label: "ODI", value: "odi" },
  { label: "T20I", value: "t20i" },
];

interface Props {
  active: CricketFormat;
  onChange: (fmt: CricketFormat) => void;
}

export default function FormatTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 mb-6 border-b border-lavender-rose">
      {FORMATS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
            active === f.value
              ? "bg-lavender-dark text-lavender-cream border-b-2 border-lavender-dark"
              : "text-lavender-mid hover:bg-lavender-rose/20"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
