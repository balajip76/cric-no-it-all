"use client";

import type { Player } from "@/types/database.types";

interface Props {
  results: Player[];
  onSelect: (player: Player) => void;
}

export default function SearchResults({ results, onSelect }: Props) {
  return (
    <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {results.map((player) => (
        <li key={player.id}>
          <button
            onClick={() => onSelect(player)}
            className="w-full text-left px-5 py-3 hover:bg-cricket-green-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">
              {player.display_name ?? player.full_name}
            </span>
            {player.country && (
              <span className="ml-2 text-sm text-gray-500">{player.country}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
