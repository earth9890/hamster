-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_socket VARCHAR(255) NOT NULL,
  user2_socket VARCHAR(255) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  ended_reason VARCHAR(50),
  user1_country VARCHAR(2),
  user2_country VARCHAR(2),
  user1_language VARCHAR(5),
  user2_language VARCHAR(5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user1_socket ON sessions(user1_socket);
CREATE INDEX IF NOT EXISTS idx_sessions_user2_socket ON sessions(user2_socket);
