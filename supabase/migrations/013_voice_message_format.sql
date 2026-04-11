-- Add message_format column to voice_messages table
-- Supports 'audio' (default) and 'video' formats
ALTER TABLE voice_messages
ADD COLUMN IF NOT EXISTS message_format text NOT NULL DEFAULT 'audio'
CHECK (message_format IN ('audio', 'video'));
