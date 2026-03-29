"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DismissalStats } from "@/types/database.types";

interface Props {
  data: DismissalStats[];
}

// All five palette colors + two intermediate shades for variety
const COLORS = ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4", "#6b6580"];

export default function DismissalChart({ data }: Props) {
  if (!data.length)
    return <div className="text-lavender-muted text-sm py-4">No dismissal data available.</div>;

  const totals = {
    Bowled:   data.reduce((s, d) => s + (d.dismissed_bowled ?? 0), 0),
    Caught:   data.reduce((s, d) => s + (d.dismissed_caught ?? 0), 0),
    "C&B":    data.reduce((s, d) => s + (d.dismissed_caught_bowled ?? 0), 0),
    LBW:      data.reduce((s, d) => s + (d.dismissed_lbw ?? 0), 0),
    Stumped:  data.reduce((s, d) => s + (d.dismissed_stumped ?? 0), 0),
    "Run Out":data.reduce((s, d) => s + (d.dismissed_run_out ?? 0), 0),
  };

  const pieData = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const topBowlers = data.slice(0, 8);

  return (
    <div>
      <h3 className="text-base font-semibold text-lavender-dark mb-3">Dismissal Patterns</h3>
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
              <Tooltip
                formatter={(v) => [`${v} times`, ""]}
                contentStyle={{
                  background: "#f2e9e4",
                  border: "1px solid #c9ada7",
                  borderRadius: "8px",
                  color: "#22223b",
                }}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ color: "#4a4e69", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-lavender-muted mb-2">Most dismissed by</h4>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-lavender-muted text-xs border-b border-lavender-rose">
                <th className="text-left py-1">Bowler</th>
                <th className="text-right py-1 pr-3">Total</th>
                <th className="text-right py-1 pr-3">B</th>
                <th className="text-right py-1 pr-3">C</th>
                <th className="text-right py-1">LBW</th>
              </tr>
            </thead>
            <tbody>
              {topBowlers.map((d) => (
                <tr key={d.bowler_name} className="border-t border-lavender-rose/30">
                  <td className="py-1 text-lavender-dark">
                    {d.bowler_name}
                    {d.bowler_country && (
                      <span className="ml-1 text-lavender-muted text-xs">({d.bowler_country})</span>
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
