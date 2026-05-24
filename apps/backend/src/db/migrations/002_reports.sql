-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reported_socket VARCHAR(255) NOT NULL,
  reporter_socket VARCHAR(255) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  reporter_ip VARCHAR(45),
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON reports(session_id);
