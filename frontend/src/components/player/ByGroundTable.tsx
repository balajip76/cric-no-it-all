"use client";

import { useState } from "react";
import type { StatsByGround } from "@/types/database.types";

interface Props {
  data: StatsByGround[];
}

function fmt(v: number | null | undefined, dec = 0) {
  if (v == null) return "-";
  return dec > 0 ? v.toFixed(dec) : String(v);
}

type SortKey = keyof StatsByGround;

export default function ByGroundTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("bat_runs");
  const [asc, setAsc] = useState(false);

  const sorted = [...data].sort((a, b) => {
    const av = (a[sortKey] as number) ?? -Infinity;
    const bv = (b[sortKey] as number) ?? -Infinity;
    return asc ? av - bv : bv - av;
  });

  const toggle = (key: SortKey) => {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(false); }
  };

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggle(k)}
      className="px-3 py-2 text-xs font-semibold cursor-pointer select-none whitespace-nowrap
                 hover:bg-lavender-rose/20 transition-colors"
    >
      {label} {sortKey === k ? (asc ? "↑" : "↓") : ""}
    </th>
  );

  if (!data.length)
    return <div className="text-lavender-muted text-sm py-4">No ground data available.</div>;

  return (
    <div className="overflow-x-auto">
      <h3 className="text-base font-semibold text-lavender-dark mb-3">Batting by Ground</h3>
      <table className="min-w-full text-sm">
        <thead className="bg-lavender-cream text-lavender-mid text-left border-b border-lavender-rose">
          <tr>
            <Th k="ground" label="Ground" />
            <Th k="bat_matches" label="Mat" />
            <Th k="bat_innings" label="Inn" />
            <Th k="bat_runs" label="Runs" />
            <Th k="bat_average" label="Avg" />
            <Th k="bat_hundreds" label="100s" />
            <Th k="bat_fifties" label="50s" />
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 15).map((row) => (
            <tr key={row.ground} className="border-b border-lavender-rose/30 hover:bg-lavender-cream/60">
              <td className="px-3 py-2 font-medium text-lavender-dark">{row.ground}</td>
              <td className="px-3 py-2 text-center">{fmt(row.bat_matches)}</td>
              <td className="px-3 py-2 text-center">{fmt(row.bat_innings)}</td>
              <td className="px-3 py-2 text-center">{fmt(row.bat_runs)}</td>
              <td className="px-3 py-2 text-center">{fmt(row.bat_average, 2)}</td>
              <td className="px-3 py-2 text-center">{fmt(row.bat_hundreds)}</td>
              <td className="px-3 py-2 text-center">{fmt(row.bat_fifties)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
