-- Bans table
CREATE TABLE IF NOT EXISTS bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address VARCHAR(45) NOT NULL,
  reason VARCHAR(255),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for bans
CREATE INDEX IF NOT EXISTS idx_bans_ip ON bans(ip_address);
CREATE INDEX IF NOT EXISTS idx_bans_expires ON bans(expires_at);
CREATE INDEX IF NOT EXISTS idx_bans_is_permanent ON bans(is_permanent);

-- Unique constraint to prevent duplicate active bans for same IP
CREATE UNIQUE INDEX IF NOT EXISTS idx_bans_unique_active_ip
  ON bans(ip_address)
  WHERE is_permanent = TRUE OR (expires_at IS NOT NULL AND expires_at > NOW());
