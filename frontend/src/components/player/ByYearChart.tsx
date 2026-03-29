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
      <div className="text-gray-400 text-sm py-6 text-center">
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
      <h3 className="text-base font-semibold mb-3">Batting by Year</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="runs" orientation="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="avg" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="runs" dataKey="runs" name="Runs" fill="#16a34a" opacity={0.8} />
          <Line
            yAxisId="avg"
            type="monotone"
            dataKey="avg"
            name="Average"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
