import type { CareerStats, CricketFormat } from "@/types/database.types";

interface Props {
  stats: CareerStats[];
  format: CricketFormat;
}

function fmt(v: number | null | undefined, decimals = 0): string {
  if (v == null) return "-";
  return decimals > 0 ? v.toFixed(decimals) : String(v);
}

export default function CareerSummaryCard({ stats, format }: Props) {
  const s = stats.find((r) => r.format === format);

  if (!s) {
    return (
      <div className="rounded-xl border border-gray-200 p-6 text-gray-500 text-sm">
        No career stats available for this format yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Batting */}
      <section>
        <h3 className="text-sm font-semibold text-cricket-green-700 uppercase tracking-wider mb-3">
          Batting
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {[
            ["Mat", fmt(s.bat_matches)],
            ["Inns", fmt(s.bat_innings)],
            ["NO", fmt(s.bat_not_outs)],
            ["Runs", fmt(s.bat_runs)],
            ["HS", s.bat_highest ?? "-"],
            ["Avg", fmt(s.bat_average, 2)],
            ["SR", fmt(s.bat_strike_rate, 2)],
            ["100s", fmt(s.bat_hundreds)],
            ["50s", fmt(s.bat_fifties)],
            ["Ducks", fmt(s.bat_ducks)],
            ["4s", fmt(s.bat_fours)],
            ["6s", fmt(s.bat_sixes)],
          ].map(([label, value]) => (
            <div key={label} className="text-center">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bowling */}
      {(s.bowl_wickets != null || s.bowl_matches != null) && (
        <section>
          <h3 className="text-sm font-semibold text-cricket-green-700 uppercase tracking-wider mb-3">
            Bowling
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {[
              ["Mat", fmt(s.bowl_matches)],
              ["Inns", fmt(s.bowl_innings)],
              ["Wkts", fmt(s.bowl_wickets)],
              ["Avg", fmt(s.bowl_average, 2)],
              ["Econ", fmt(s.bowl_economy, 2)],
              ["SR", fmt(s.bowl_strike_rate, 2)],
              ["Best", s.bowl_best_innings ?? "-"],
              ["5W", fmt(s.bowl_five_wickets)],
              ["10W", fmt(s.bowl_ten_wickets)],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-lg font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fielding + Captaincy */}
      <div className="flex flex-wrap gap-8">
        {(s.field_catches != null || s.field_stumpings != null) && (
          <section>
            <h3 className="text-sm font-semibold text-cricket-green-700 uppercase tracking-wider mb-2">
              Fielding
            </h3>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500">Catches</div>
                <div className="text-lg font-semibold">{fmt(s.field_catches)}</div>
              </div>
              {s.field_stumpings != null && (
                <div className="text-center">
                  <div className="text-xs text-gray-500">Stumpings</div>
                  <div className="text-lg font-semibold">{fmt(s.field_stumpings)}</div>
                </div>
              )}
            </div>
          </section>
        )}
        {s.capt_matches != null && (
          <section>
            <h3 className="text-sm font-semibold text-cricket-green-700 uppercase tracking-wider mb-2">
              As Captain
            </h3>
            <div className="flex gap-4">
              {[
                ["P", fmt(s.capt_matches)],
                ["W", fmt(s.capt_wins)],
                ["L", fmt(s.capt_losses)],
                ["D", fmt(s.capt_draws)],
              ].map(([label, value]) => (
                <div key={label} className="text-center">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
