"use client";

import { use, useState, useEffect } from "react";
import { usePlayerData } from "@/hooks/usePlayerData";
import { triggerScrape } from "@/lib/api";
import PlayerHero from "@/components/player/PlayerHero";
import FormatTabs from "@/components/player/FormatTabs";
import CareerSummaryCard from "@/components/player/CareerSummaryCard";
import ByYearChart from "@/components/player/ByYearChart";
import ByOpponentTable from "@/components/player/ByOpponentTable";
import ByGroundTable from "@/components/player/ByGroundTable";
import HomeAwayCard from "@/components/player/HomeAwayCard";
import DismissalChart from "@/components/player/DismissalChart";
import ChatPanel from "@/components/chat/ChatPanel";
import type { CricketFormat } from "@/types/database.types";

interface Props {
  params: Promise<{ playerId: string }>;
}

type ContentTab = "overview" | "charts" | "innings";

export default function PlayerPage({ params }: Props) {
  const { playerId } = use(params);
  const howstatId = Number(playerId);

  const [format, setFormat] = useState<CricketFormat>("test");
  const [contentTab, setContentTab] = useState<ContentTab>("overview");
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "pending" | "done">("idle");

  const { player, careerStats, statsByYear, statsByOpponent, statsByGround,
          homeAway, dismissals, loading, error } = usePlayerData(howstatId, format);

  // Trigger scrape if player not found or no career stats
  useEffect(() => {
    if (!loading && (!player || !careerStats.length) && scrapeStatus === "idle") {
      setScrapeStatus("pending");
      triggerScrape(howstatId)
        .then(() => {
          // Poll Supabase after a delay
          setTimeout(() => setScrapeStatus("done"), 8000);
        })
        .catch(() => setScrapeStatus("done"));
    }
  }, [loading, player, careerStats.length, howstatId, scrapeStatus]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl mb-6" />
        <div className="h-10 bg-gray-200 rounded mb-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-[500px] bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !player) {
    if (scrapeStatus === "pending") {
      return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-cricket-green-700 text-xl font-semibold mb-2">
            Fetching player data...
          </div>
          <p className="text-gray-500">
            Scraping stats from howstat.com. This takes about 30–60 seconds for a new player.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-cricket-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">Player not found. Please check the ID and try again.</p>
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PlayerHero player={player} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: stats column */}
        <div className="lg:col-span-2 space-y-8">
          <FormatTabs active={format} onChange={setFormat} />

          {/* Content sub-tabs */}
          <div className="flex gap-3 mb-2">
            {(["overview", "charts", "innings"] as ContentTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setContentTab(tab)}
                className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                  contentTab === tab
                    ? "bg-cricket-green-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {contentTab === "overview" && (
            <>
              <CareerSummaryCard stats={careerStats} format={format} />
              <HomeAwayCard data={homeAway} />
              <ByOpponentTable data={statsByOpponent} />
              <ByGroundTable data={statsByGround} />
            </>
          )}

          {contentTab === "charts" && (
            <>
              <ByYearChart data={statsByYear} />
              <DismissalChart data={dismissals} />
            </>
          )}

          {contentTab === "innings" && (
            <div className="text-gray-500 text-sm py-4">
              Innings-by-innings log coming in Phase 2.
            </div>
          )}
        </div>

        {/* Right: chat panel */}
        <div className="h-[600px] lg:h-auto lg:min-h-[600px]">
          <ChatPanel howstatId={howstatId} format={format} />
        </div>
      </div>
    </div>
  );
}
