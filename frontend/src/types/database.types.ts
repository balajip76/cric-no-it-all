/**
 * Auto-generated Supabase TypeScript types.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 *
 * The types below are manually authored to match 001_initial_schema.sql.
 * Replace with the generated output after running the Supabase CLI.
 */

export type CricketFormat = "test" | "odi" | "t20i";

export interface Player {
  id: string;
  howstat_id: number;
  full_name: string;
  display_name: string | null;
  country: string | null;
  date_of_birth: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  profile_scraped_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareerStats {
  id: string;
  player_id: string;
  format: CricketFormat;
  bat_matches: number | null;
  bat_innings: number | null;
  bat_not_outs: number | null;
  bat_runs: number | null;
  bat_highest: string | null;
  bat_average: number | null;
  bat_strike_rate: number | null;
  bat_hundreds: number | null;
  bat_fifties: number | null;
  bat_ducks: number | null;
  bat_fours: number | null;
  bat_sixes: number | null;
  bowl_matches: number | null;
  bowl_innings: number | null;
  bowl_balls: number | null;
  bowl_maidens: number | null;
  bowl_runs: number | null;
  bowl_wickets: number | null;
  bowl_average: number | null;
  bowl_economy: number | null;
  bowl_strike_rate: number | null;
  bowl_best_innings: string | null;
  bowl_five_wickets: number | null;
  bowl_ten_wickets: number | null;
  field_catches: number | null;
  field_stumpings: number | null;
  capt_matches: number | null;
  capt_wins: number | null;
  capt_losses: number | null;
  capt_draws: number | null;
  scraped_at: string | null;
}

export interface InningsBatting {
  id: string;
  player_id: string;
  format: CricketFormat;
  match_number: number;
  innings_number: number;
  match_date: string | null;
  opponent: string | null;
  ground: string | null;
  runs: number | null;
  balls_faced: number | null;
  strike_rate: number | null;
  dismissal_type: string | null;
  not_out: boolean;
  scraped_at: string | null;
}

export interface InningsBowling {
  id: string;
  player_id: string;
  format: CricketFormat;
  match_number: number;
  innings_number: number;
  match_date: string | null;
  opponent: string | null;
  ground: string | null;
  overs: number | null;
  maidens: number | null;
  runs_conceded: number | null;
  wickets: number | null;
  economy: number | null;
  scraped_at: string | null;
}

export interface StatsByYear {
  id: string;
  player_id: string;
  format: CricketFormat;
  year: number;
  bat_matches: number | null;
  bat_innings: number | null;
  bat_runs: number | null;
  bat_not_outs: number | null;
  bat_average: number | null;
  bat_strike_rate: number | null;
  bat_highest: string | null;
  bat_hundreds: number | null;
  bat_fifties: number | null;
  bowl_wickets: number | null;
  bowl_average: number | null;
  bowl_economy: number | null;
  scraped_at: string | null;
}

export interface StatsByOpponent {
  id: string;
  player_id: string;
  format: CricketFormat;
  opponent: string;
  bat_matches: number | null;
  bat_innings: number | null;
  bat_runs: number | null;
  bat_not_outs: number | null;
  bat_average: number | null;
  bat_strike_rate: number | null;
  bat_highest: string | null;
  bat_hundreds: number | null;
  bat_fifties: number | null;
  bowl_wickets: number | null;
  bowl_average: number | null;
  bowl_economy: number | null;
  scraped_at: string | null;
}

export interface StatsByGround {
  id: string;
  player_id: string;
  format: CricketFormat;
  ground: string;
  bat_matches: number | null;
  bat_innings: number | null;
  bat_runs: number | null;
  bat_not_outs: number | null;
  bat_average: number | null;
  bat_strike_rate: number | null;
  bat_highest: string | null;
  bat_hundreds: number | null;
  bat_fifties: number | null;
  bowl_wickets: number | null;
  scraped_at: string | null;
}

export interface StatsHomeAway {
  id: string;
  player_id: string;
  format: CricketFormat;
  venue_type: "home" | "away" | "neutral";
  bat_matches: number | null;
  bat_innings: number | null;
  bat_runs: number | null;
  bat_not_outs: number | null;
  bat_average: number | null;
  bat_strike_rate: number | null;
  bat_highest: string | null;
  bat_hundreds: number | null;
  bat_fifties: number | null;
  bowl_wickets: number | null;
  scraped_at: string | null;
}

export interface DismissalStats {
  id: string;
  player_id: string;
  format: CricketFormat;
  bowler_name: string;
  bowler_country: string | null;
  dismissed_bowled: number;
  dismissed_caught: number;
  dismissed_caught_bowled: number;
  dismissed_lbw: number;
  dismissed_stumped: number;
  dismissed_run_out: number;
  dismissed_total: number;
  scraped_at: string | null;
}

export interface ChatSession {
  id: string;
  player_id: string;
  format_context: CricketFormat;
  created_at: string;
  last_active_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Supabase client generic type (used by createClient<Database>)
export interface Database {
  public: {
    Tables: {
      players: { Row: Player; Insert: Partial<Player>; Update: Partial<Player> };
      career_stats: { Row: CareerStats; Insert: Partial<CareerStats>; Update: Partial<CareerStats> };
      innings_batting: { Row: InningsBatting; Insert: Partial<InningsBatting>; Update: Partial<InningsBatting> };
      innings_bowling: { Row: InningsBowling; Insert: Partial<InningsBowling>; Update: Partial<InningsBowling> };
      stats_by_year: { Row: StatsByYear; Insert: Partial<StatsByYear>; Update: Partial<StatsByYear> };
      stats_by_opponent: { Row: StatsByOpponent; Insert: Partial<StatsByOpponent>; Update: Partial<StatsByOpponent> };
      stats_by_ground: { Row: StatsByGround; Insert: Partial<StatsByGround>; Update: Partial<StatsByGround> };
      stats_home_away: { Row: StatsHomeAway; Insert: Partial<StatsHomeAway>; Update: Partial<StatsHomeAway> };
      dismissal_stats: { Row: DismissalStats; Insert: Partial<DismissalStats>; Update: Partial<DismissalStats> };
      chat_sessions: { Row: ChatSession; Insert: Partial<ChatSession>; Update: Partial<ChatSession> };
      chat_messages: { Row: ChatMessage; Insert: Partial<ChatMessage>; Update: Partial<ChatMessage> };
    };
  };
}
