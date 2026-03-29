"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DismissalStats } from "@/types/database.types";

interface Props {
  data: DismissalStats[];
}

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DismissalChart({ data }: Props) {
  if (!data.length)
    return <div className="text-gray-400 text-sm py-4">No dismissal data available.</div>;

  // Aggregate dismissal types across all bowlers
  const totals = {
    Bowled: data.reduce((s, d) => s + (d.dismissed_bowled ?? 0), 0),
    Caught: data.reduce((s, d) => s + (d.dismissed_caught ?? 0), 0),
    "C&B": data.reduce((s, d) => s + (d.dismissed_caught_bowled ?? 0), 0),
    LBW: data.reduce((s, d) => s + (d.dismissed_lbw ?? 0), 0),
    Stumped: data.reduce((s, d) => s + (d.dismissed_stumped ?? 0), 0),
    "Run Out": data.reduce((s, d) => s + (d.dismissed_run_out ?? 0), 0),
  };

  const pieData = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const topBowlers = data.slice(0, 8);

  return (
    <div>
      <h3 className="text-base font-semibold mb-3">Dismissal Patterns</h3>
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={260} height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} times`, ""]} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            Most dismissed by
          </h4>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left py-1">Bowler</th>
                <th className="text-right py-1 pr-3">Total</th>
                <th className="text-right py-1 pr-3">B</th>
                <th className="text-right py-1 pr-3">C</th>
                <th className="text-right py-1">LBW</th>
              </tr>
            </thead>
            <tbody>
              {topBowlers.map((d) => (
                <tr key={d.bowler_name} className="border-t border-gray-100">
                  <td className="py-1">
                    {d.bowler_name}
                    {d.bowler_country && (
                      <span className="ml-1 text-gray-400 text-xs">({d.bowler_country})</span>
                    )}
                  </td>
                  <td className="text-right py-1 pr-3 font-semibold">{d.dismissed_total}</td>
                  <td className="text-right py-1 pr-3">{d.dismissed_bowled}</td>
                  <td className="text-right py-1 pr-3">{d.dismissed_caught}</td>
                  <td className="text-right py-1">{d.dismissed_lbw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
