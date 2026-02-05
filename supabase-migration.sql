-- Add missing columns to valentines table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

ALTER TABLE valentines
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS creator_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS spotify_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS spotify_artist VARCHAR(255),
ADD COLUMN IF NOT EXISTS spotify_thumbnail VARCHAR(500),
ADD COLUMN IF NOT EXISTS music_preview_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS font_size INT DEFAULT 16,
ADD COLUMN IF NOT EXISTS canvas_layout JSONB,
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Create index on admin_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_valentines_admin_token ON valentines(admin_token);

-- Create index on name for subdomain alternative
CREATE INDEX IF NOT EXISTS idx_valentines_name ON valentines(name);
