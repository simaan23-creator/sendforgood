-- 044: capture self-reported attribution on first dashboard visit.
--
-- We have ~zero attribution signal today — no UTM capture at signup,
-- no Referer storage. A first-visit "how did you hear about us?" prompt
-- gives us coarse-grained but real attribution that survives ad blockers
-- and Safari's cookie restrictions.
--
-- heard_about_us: free-text answer or one of a small preset list
--   (google, pinterest, social, etsy, friend, vendor, other)
-- heard_about_us_dismissed_at: set if the user closed the prompt without
--   answering. We use this (rather than just NULL) so we never re-prompt
--   a user who deliberately ignored it.

alter table profiles
  add column if not exists heard_about_us text null,
  add column if not exists heard_about_us_dismissed_at timestamptz null;
