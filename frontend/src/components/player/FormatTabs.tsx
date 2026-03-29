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
    <div className="flex gap-1 mb-6 border-b border-gray-200">
      {FORMATS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
            active === f.value
              ? "bg-cricket-green-700 text-white border-b-2 border-cricket-green-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
