"use client";

import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import SearchResults from "./SearchResults";

export default function SearchBar() {
  const router = useRouter();
  const { query, setQuery, results, loading } = useSearch();

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a player (e.g. Virat Kohli)..."
        className="w-full px-5 py-3 text-lg rounded-full border-2 border-cricket-green-600
                   focus:outline-none focus:border-cricket-green-800
                   bg-white shadow-md"
        aria-label="Search players"
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-4 top-3.5 text-gray-400 text-sm animate-pulse">
          Searching...
        </span>
      )}
      {results.length > 0 && (
        <SearchResults
          results={results}
          onSelect={(player) => {
            setQuery("");
            router.push(`/players/${player.howstat_id}`);
          }}
        />
      )}
    </div>
  );
}
