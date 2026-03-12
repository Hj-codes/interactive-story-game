-- Database initialization script for Interactive Story Game

CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    story_context TEXT NOT NULL DEFAULT '',
    current_story TEXT NOT NULL DEFAULT '',
    choices_history TEXT NOT NULL DEFAULT '[]', -- JSON array
    character_info TEXT NOT NULL DEFAULT '{}',   -- JSON object
    current_choices TEXT NOT NULL DEFAULT '[]', -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_games (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    save_name TEXT NOT NULL,
    game_state TEXT NOT NULL, -- JSON
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions (id)
);

CREATE TABLE IF NOT EXISTS personality_profiles (
    session_id TEXT PRIMARY KEY,
    history_fingerprint TEXT NOT NULL,
    choices_analyzed INTEGER NOT NULL DEFAULT 0,
    analysis_version INTEGER NOT NULL DEFAULT 1,
    model_name TEXT NOT NULL DEFAULT 'sonar',
    status TEXT NOT NULL DEFAULT 'completed',
    archetype TEXT NOT NULL,
    summary TEXT NOT NULL,
    trait_scores TEXT NOT NULL DEFAULT '{}', -- JSON object
    evidence TEXT NOT NULL DEFAULT '[]',     -- JSON array
    raw_response TEXT,                       -- JSON object
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_games_session_id ON saved_games(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_games_saved_at ON saved_games(saved_at);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_status ON personality_profiles(status);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_updated_at ON personality_profiles(updated_at);
