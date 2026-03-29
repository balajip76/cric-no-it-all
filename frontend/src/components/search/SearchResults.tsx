"use client";

import type { Player } from "@/types/database.types";

interface Props {
  results: Player[];
  onSelect: (player: Player) => void;
}

export default function SearchResults({ results, onSelect }: Props) {
  return (
    <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-lavender-rose shadow-lg overflow-hidden">
      {results.map((player) => (
        <li key={player.id}>
          <button
            onClick={() => onSelect(player)}
            className="w-full text-left px-5 py-3 hover:bg-lavender-cream transition-colors"
          >
            <span className="font-semibold text-lavender-dark">
              {player.display_name ?? player.full_name}
            </span>
            {player.country && (
              <span className="ml-2 text-sm text-lavender-muted">{player.country}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
