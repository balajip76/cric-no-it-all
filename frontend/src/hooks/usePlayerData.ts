"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Player,
  CareerStats,
  StatsByYear,
  StatsByOpponent,
  StatsByGround,
  StatsHomeAway,
  DismissalStats,
  CricketFormat,
} from "@/types/database.types";

interface PlayerData {
  player: Player | null;
  careerStats: CareerStats[];
  statsByYear: StatsByYear[];
  statsByOpponent: StatsByOpponent[];
  statsByGround: StatsByGround[];
  homeAway: StatsHomeAway[];
  dismissals: DismissalStats[];
  loading: boolean;
  error: string | null;
}

export function usePlayerData(
  howstatId: number,
  format: CricketFormat = "test"
): PlayerData {
  const [data, setData] = useState<PlayerData>({
    player: null,
    careerStats: [],
    statsByYear: [],
    statsByOpponent: [],
    statsByGround: [],
    homeAway: [],
    dismissals: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Load player first to get UUID
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("howstat_id", howstatId)
        .single();

      if (playerError || !playerData) {
        if (!cancelled)
          setData((prev) => ({
            ...prev,
            loading: false,
            error: "Player not found",
          }));
        return;
      }

      const playerId = playerData.id;

      // Fetch all format-specific data in parallel
      const [
        careerRes,
        yearRes,
        oppRes,
        groundRes,
        haRes,
        dismissRes,
      ] = await Promise.all([
        supabase.from("career_stats").select("*").eq("player_id", playerId),
        supabase
          .from("stats_by_year")
          .select("*")
          .eq("player_id", playerId)
          .eq("format", format)
          .order("year"),
        supabase
          .from("stats_by_opponent")
          .select("*")
          .eq("player_id", playerId)
          .eq("format", format)
          .order("bat_runs", { ascending: false }),
        supabase
          .from("stats_by_ground")
          .select("*")
          .eq("player_id", playerId)
          .eq("format", format)
          .order("bat_runs", { ascending: false }),
        supabase
          .from("stats_home_away")
          .select("*")
          .eq("player_id", playerId)
          .eq("format", format),
        supabase
          .from("dismissal_stats")
          .select("*")
          .eq("player_id", playerId)
          .eq("format", format)
          .order("dismissed_total", { ascending: false })
          .limit(20),
      ]);

      if (!cancelled) {
        setData({
          player: playerData as Player,
          careerStats: (careerRes.data as CareerStats[]) ?? [],
          statsByYear: (yearRes.data as StatsByYear[]) ?? [],
          statsByOpponent: (oppRes.data as StatsByOpponent[]) ?? [],
          statsByGround: (groundRes.data as StatsByGround[]) ?? [],
          homeAway: (haRes.data as StatsHomeAway[]) ?? [],
          dismissals: (dismissRes.data as DismissalStats[]) ?? [],
          loading: false,
          error: null,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [howstatId, format]);

  return data;
}
