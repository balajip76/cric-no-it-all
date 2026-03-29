-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for cricket formats
CREATE TYPE cricket_format AS ENUM ('test', 'odi', 't20i');

-- ============================================================
-- players
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    howstat_id          INTEGER UNIQUE NOT NULL,
    full_name           TEXT NOT NULL,
    display_name        TEXT,
    country             TEXT,
    date_of_birth       DATE,
    batting_style       TEXT,
    bowling_style       TEXT,
    profile_scraped_at  TIMESTAMPTZ,
    last_viewed_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_full_name_trgm
    ON players USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_players_country
    ON players (country);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_players_full_name_fts
    ON players USING GIN (to_tsvector('english', full_name));

-- ============================================================
-- career_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS career_stats (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,

    -- Batting
    bat_matches         INTEGER,
    bat_innings         INTEGER,
    bat_not_outs        INTEGER,
    bat_runs            INTEGER,
    bat_highest         TEXT,
    bat_average         NUMERIC(7,2),
    bat_strike_rate     NUMERIC(7,2),
    bat_hundreds        INTEGER,
    bat_fifties         INTEGER,
    bat_ducks           INTEGER,
    bat_fours           INTEGER,
    bat_sixes           INTEGER,

    -- Bowling
    bowl_matches        INTEGER,
    bowl_innings        INTEGER,
    bowl_balls          INTEGER,
    bowl_maidens        INTEGER,
    bowl_runs           INTEGER,
    bowl_wickets        INTEGER,
    bowl_average        NUMERIC(7,2),
    bowl_economy        NUMERIC(7,2),
    bowl_strike_rate    NUMERIC(7,2),
    bowl_best_innings   TEXT,
    bowl_five_wickets   INTEGER,
    bowl_ten_wickets    INTEGER,

    -- Fielding
    field_catches       INTEGER,
    field_stumpings     INTEGER,

    -- Captaincy
    capt_matches        INTEGER,
    capt_wins           INTEGER,
    capt_losses         INTEGER,
    capt_draws          INTEGER,

    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format)
);

-- ============================================================
-- innings_batting
-- ============================================================
CREATE TABLE IF NOT EXISTS innings_batting (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,
    match_number        INTEGER NOT NULL,
    innings_number      INTEGER NOT NULL DEFAULT 1,
    match_date          DATE,
    opponent            TEXT,
    ground              TEXT,
    runs                INTEGER,
    balls_faced         INTEGER,
    strike_rate         NUMERIC(7,2),
    dismissal_type      TEXT,
    not_out             BOOLEAN DEFAULT FALSE,
    howstat_match_code  TEXT,
    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format, match_number, innings_number)
);

CREATE INDEX IF NOT EXISTS idx_innings_batting_player_format
    ON innings_batting (player_id, format);

-- ============================================================
-- innings_bowling
-- ============================================================
CREATE TABLE IF NOT EXISTS innings_bowling (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,
    match_number        INTEGER NOT NULL,
    innings_number      INTEGER NOT NULL DEFAULT 1,
    match_date          DATE,
    opponent            TEXT,
    ground              TEXT,
    overs               NUMERIC(6,1),
    maidens             INTEGER,
    runs_conceded       INTEGER,
    wickets             INTEGER,
    economy             NUMERIC(6,2),
    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format, match_number, innings_number)
);

CREATE INDEX IF NOT EXISTS idx_innings_bowling_player_format
    ON innings_bowling (player_id, format);

-- ============================================================
-- stats_by_year
-- ============================================================
CREATE TABLE IF NOT EXISTS stats_by_year (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,
    year                INTEGER NOT NULL,
    bat_matches         INTEGER,
    bat_innings         INTEGER,
    bat_runs            INTEGER,
    bat_not_outs        INTEGER,
    bat_average         NUMERIC(7,2),
    bat_strike_rate     NUMERIC(7,2),
    bat_highest         TEXT,
    bat_hundreds        INTEGER,
    bat_fifties         INTEGER,
    bowl_wickets        INTEGER,
    bowl_average        NUMERIC(7,2),
    bowl_economy        NUMERIC(7,2),
    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format, year)
);

-- ============================================================
-- stats_by_opponent
-- ============================================================
CREATE TABLE IF NOT EXISTS stats_by_opponent (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,
    opponent            TEXT NOT NULL,
    bat_matches         INTEGER,
    bat_innings         INTEGER,
    bat_runs            INTEGER,
    bat_not_outs        INTEGER,
    bat_average         NUMERIC(7,2),
    bat_strike_rate     NUMERIC(7,2),
    bat_highest         TEXT,
    bat_hundreds        INTEGER,
    bat_fifties         INTEGER,
    bowl_wickets        INTEGER,
    bowl_average        NUMERIC(7,2),
    bowl_economy        NUMERIC(7,2),
    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format, opponent)
);

-- ============================================================
-- stats_by_ground
-- ============================================================
CREATE TABLE IF NOT EXISTS stats_by_ground (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,
    ground              TEXT NOT NULL,
    bat_matches         INTEGER,
    bat_innings         INTEGER,
    bat_runs            INTEGER,
    bat_not_outs        INTEGER,
    bat_average         NUMERIC(7,2),
    bat_strike_rate     NUMERIC(7,2),
    bat_highest         TEXT,
    bat_hundreds        INTEGER,
    bat_fifties         INTEGER,
    bowl_wickets        INTEGER,
    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format, ground)
);

-- ============================================================
-- stats_home_away
-- ============================================================
CREATE TABLE IF NOT EXISTS stats_home_away (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format              cricket_format NOT NULL,
    venue_type          TEXT NOT NULL CHECK (venue_type IN ('home', 'away', 'neutral')),
    bat_matches         INTEGER,
    bat_innings         INTEGER,
    bat_runs            INTEGER,
    bat_not_outs        INTEGER,
    bat_average         NUMERIC(7,2),
    bat_strike_rate     NUMERIC(7,2),
    bat_highest         TEXT,
    bat_hundreds        INTEGER,
    bat_fifties         INTEGER,
    bowl_wickets        INTEGER,
    scraped_at          TIMESTAMPTZ,
    UNIQUE (player_id, format, venue_type)
);

-- ============================================================
-- dismissal_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS dismissal_stats (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id                   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format                      cricket_format NOT NULL,
    bowler_name                 TEXT NOT NULL,
    bowler_country              TEXT,
    dismissed_bowled            INTEGER DEFAULT 0,
    dismissed_caught            INTEGER DEFAULT 0,
    dismissed_caught_bowled     INTEGER DEFAULT 0,
    dismissed_lbw               INTEGER DEFAULT 0,
    dismissed_stumped           INTEGER DEFAULT 0,
    dismissed_run_out           INTEGER DEFAULT 0,
    dismissed_total             INTEGER DEFAULT 0,
    scraped_at                  TIMESTAMPTZ,
    UNIQUE (player_id, format, bowler_name)
);

-- ============================================================
-- chat_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    format_context      cricket_format NOT NULL DEFAULT 'test',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    last_active_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- chat_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
    ON chat_messages (session_id, created_at);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_stats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings_batting ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings_bowling ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_by_year   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_by_opponent ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_by_ground ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_home_away ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissal_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads on all tables
CREATE POLICY "allow_public_read" ON players         FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON career_stats    FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON innings_batting FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON innings_bowling FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON stats_by_year   FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON stats_by_opponent FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON stats_by_ground FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON stats_home_away FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON dismissal_stats FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON chat_sessions   FOR SELECT USING (true);
CREATE POLICY "allow_public_read" ON chat_messages   FOR SELECT USING (true);
