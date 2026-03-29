import type { StatsHomeAway } from "@/types/database.types";

interface Props {
  data: StatsHomeAway[];
}

function fmt(v: number | null | undefined, dec = 0) {
  if (v == null) return "-";
  return dec > 0 ? v.toFixed(dec) : String(v);
}

const VENUE_STYLES: Record<string, string> = {
  home:    "bg-lavender-dark  text-lavender-cream border-lavender-dark",
  away:    "bg-lavender-mid   text-lavender-cream border-lavender-mid",
  neutral: "bg-lavender-rose  text-lavender-dark  border-lavender-rose",
};

const LABEL_STYLES: Record<string, string> = {
  home:    "text-lavender-rose",
  away:    "text-lavender-rose",
  neutral: "text-lavender-mid",
};

export default function HomeAwayCard({ data }: Props) {
  if (!data.length)
    return <div className="text-lavender-muted text-sm py-4">No home/away data available.</div>;

  return (
    <div>
      <h3 className="text-base font-semibold text-lavender-dark mb-3">Home / Away Split</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((row) => (
          <div
            key={row.venue_type}
            className={`rounded-xl border p-4 ${VENUE_STYLES[row.venue_type] ?? "bg-lavender-cream"}`}
          >
            <h4 className={`font-semibold capitalize text-sm mb-3 ${LABEL_STYLES[row.venue_type] ?? ""}`}>
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
                  <span className="opacity-70">{label}: </span>
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
