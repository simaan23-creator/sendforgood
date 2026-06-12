-- Per-day idempotency lock for cron handlers.
--
-- Problem: Vercel cron occasionally invokes a scheduled handler more than
-- once per scheduled time (parallel regional fires, deployment-window
-- double-fires, internal retries on slow responses). For the cold-outreach
-- cron this caused every recipient to receive the same email twice within
-- ~1 second on 2026-06-08..06-11.
--
-- Fix: at the start of each cron run, INSERT (cron_name, run_date). The
-- composite primary key makes a concurrent second invocation fail with a
-- unique-constraint violation, which the handler treats as "another
-- instance already started today's run" and exits cleanly without sending.

create table if not exists cron_run_log (
  cron_name text not null,
  run_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  events_sent int,
  primary key (cron_name, run_date)
);

-- Index for ad-hoc "show me the last 30 days of runs" admin queries.
create index if not exists cron_run_log_started_at_idx
  on cron_run_log (started_at desc);
