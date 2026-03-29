"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StatsByYear } from "@/types/database.types";

interface Props {
  data: StatsByYear[];
}

export default function ByYearChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="text-lavender-muted text-sm py-6 text-center">
        No year-by-year data available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    year: d.year,
    runs: d.bat_runs ?? 0,
    avg: d.bat_average ?? 0,
    wickets: d.bowl_wickets ?? 0,
  }));

  return (
    <div>
      <h3 className="text-base font-semibold text-lavender-dark mb-3">Batting by Year</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#c9ada7" strokeOpacity={0.4} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#4a4e69" }} />
          <YAxis yAxisId="runs" orientation="left" tick={{ fontSize: 12, fill: "#4a4e69" }} />
          <YAxis yAxisId="avg" orientation="right" tick={{ fontSize: 12, fill: "#9a8c98" }} />
          <Tooltip
            contentStyle={{
              background: "#f2e9e4",
              border: "1px solid #c9ada7",
              borderRadius: "8px",
              color: "#22223b",
            }}
          />
          <Legend wrapperStyle={{ color: "#4a4e69" }} />
          <Bar yAxisId="runs" dataKey="runs" name="Runs" fill="#4a4e69" opacity={0.85} />
          <Line
            yAxisId="avg"
            type="monotone"
            dataKey="avg"
            name="Average"
            stroke="#c9ada7"
            strokeWidth={2}
            dot={{ r: 3, fill: "#c9ada7" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
