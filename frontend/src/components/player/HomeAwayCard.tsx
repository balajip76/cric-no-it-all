import type { StatsHomeAway } from "@/types/database.types";

interface Props {
  data: StatsHomeAway[];
}

function fmt(v: number | null | undefined, dec = 0) {
  if (v == null) return "-";
  return dec > 0 ? v.toFixed(dec) : String(v);
}

const VENUE_COLORS: Record<string, string> = {
  home: "bg-cricket-green-100 border-cricket-green-300",
  away: "bg-amber-50 border-amber-200",
  neutral: "bg-gray-50 border-gray-200",
};

export default function HomeAwayCard({ data }: Props) {
  if (!data.length)
    return <div className="text-gray-400 text-sm py-4">No home/away data available.</div>;

  return (
    <div>
      <h3 className="text-base font-semibold mb-3">Home / Away Split</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((row) => (
          <div
            key={row.venue_type}
            className={`rounded-xl border p-4 ${VENUE_COLORS[row.venue_type] ?? "bg-gray-50"}`}
          >
            <h4 className="font-semibold capitalize text-sm text-gray-700 mb-3">
              {row.venue_type}
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                ["Matches", fmt(row.bat_matches)],
                ["Innings", fmt(row.bat_innings)],
                ["Runs", fmt(row.bat_runs)],
                ["Avg", fmt(row.bat_average, 2)],
                ["SR", fmt(row.bat_strike_rate, 2)],
                ["100s", fmt(row.bat_hundreds)],
                ["50s", fmt(row.bat_fifties)],
                ["Wickets", fmt(row.bowl_wickets)],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-gray-500">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
