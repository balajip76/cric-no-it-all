import type { Player } from "@/types/database.types";

interface Props {
  player: Player;
}

export default function PlayerHero({ player }: Props) {
  const careerSpan = player.profile_scraped_at
    ? `Scraped ${new Date(player.profile_scraped_at).toLocaleDateString()}`
    : null;

  return (
    <div className="bg-cricket-green-800 text-white rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-16 h-16 bg-cricket-green-600 rounded-full
                        flex items-center justify-center text-2xl font-bold">
          {(player.display_name ?? player.full_name).charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {player.display_name ?? player.full_name}
          </h1>
          <div className="mt-1 flex flex-wrap gap-3 text-cricket-green-200 text-sm">
            {player.country && <span>{player.country}</span>}
            {player.date_of_birth && (
              <span>b. {new Date(player.date_of_birth).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric"
              })}</span>
            )}
            {careerSpan && <span>{careerSpan}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {player.batting_style && (
              <span className="bg-cricket-green-700 px-2 py-0.5 rounded">
                {player.batting_style}
              </span>
            )}
            {player.bowling_style && (
              <span className="bg-cricket-green-700 px-2 py-0.5 rounded">
                {player.bowling_style}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
