-- Memory Vault: sealed vaults, credit system, and recording limits

-- Add vault columns to memory_requests
alter table memory_requests
  add column if not exists sealed_until date,
  add column if not exists is_sealed boolean not null default false,
  add column if not exists max_audio_recordings int not null default 0,
  add column if not exists max_video_recordings int not null default 0;

-- Add message_format to memory_recordings (if not exists from prior migration)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'memory_recordings' and column_name = 'message_format'
  ) then
    alter table memory_recordings add column message_format text not null default 'audio';
  end if;
end $$;

-- memory_credits table
create table if not exists memory_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_credits int not null default 0,
  video_credits int not null default 0,
  credits_used int not null default 0,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_memory_credits_user on memory_credits(user_id);
create index if not exists idx_memory_requests_sealed on memory_requests(sealed_until, status);

-- RLS policies for memory_credits
alter table memory_credits enable row level security;

create policy "Users can view own credits"
  on memory_credits for select
  using (auth.uid() = user_id);

create policy "Users can insert own credits"
  on memory_credits for insert
  with check (auth.uid() = user_id);
