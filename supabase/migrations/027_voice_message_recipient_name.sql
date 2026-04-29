-- Add inline recipient_name to voice_messages, parallel to letters (migration 018).
-- The voice editor at /voice/edit/[id] writes this field via PATCH
-- /api/voice-messages/[id]; without the column the request fails with
-- "Failed to update voice message" the moment the user hits save.

ALTER TABLE voice_messages
ADD COLUMN IF NOT EXISTS recipient_name text;
