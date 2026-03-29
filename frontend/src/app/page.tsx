import SearchBar from "@/components/search/SearchBar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-cricket-green-800 mb-3">
          Cric No-It-All
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Intelligent analytics for men's international cricket.
          Search for any player to explore stats, trends, and AI-powered insights.
        </p>
      </div>
      <SearchBar />
      <p className="mt-6 text-sm text-gray-400">
        Try "Virat Kohli", "Ben Stokes", or "Pat Cummins"
      </p>
    </main>
  );
}
