-- Memory Requests & Recordings for "Request a Memory" feature
-- Users create a request, share a link, someone records a voice message, delivered on chosen date.

-- memory_requests table
create table if not exists memory_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  title text not null,
  occasion text not null default 'Just Because',
  delivery_date date not null,
  note_to_recorder text,
  unique_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- memory_recordings table
create table if not exists memory_recordings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references memory_requests(id) on delete cascade,
  recorder_name text,
  audio_url text not null,
  duration_seconds int,
  status text not null default 'pending' check (status in ('pending', 'delivered')),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_memory_requests_requester on memory_requests(requester_id);
create index idx_memory_requests_code on memory_requests(unique_code);
create index idx_memory_requests_delivery on memory_requests(delivery_date, status);
create index idx_memory_recordings_request on memory_recordings(request_id);

-- RLS policies
alter table memory_requests enable row level security;
alter table memory_recordings enable row level security;

-- Requesters can read their own requests
create policy "Users can view own memory requests"
  on memory_requests for select
  using (auth.uid() = requester_id);

-- Requesters can insert their own requests
create policy "Users can create memory requests"
  on memory_requests for insert
  with check (auth.uid() = requester_id);

-- Requesters can update their own requests
create policy "Users can update own memory requests"
  on memory_requests for update
  using (auth.uid() = requester_id);

-- Anyone can read a memory request by unique_code (public recording page)
-- This is handled via supabaseAdmin in the API route, not RLS

-- Anyone can insert a recording (public recording page) - via supabaseAdmin
-- Requesters can read recordings on their own requests
create policy "Users can view recordings on own requests"
  on memory_recordings for select
  using (
    exists (
      select 1 from memory_requests
      where memory_requests.id = memory_recordings.request_id
      and memory_requests.requester_id = auth.uid()
    )
  );

-- Storage bucket for memory recordings
insert into storage.buckets (id, name, public)
values ('memory-recordings', 'memory-recordings', true)
on conflict (id) do nothing;

-- Allow public uploads to memory-recordings bucket
create policy "Anyone can upload memory recordings"
  on storage.objects for insert
  with check (bucket_id = 'memory-recordings');

-- Allow public reads from memory-recordings bucket
create policy "Anyone can read memory recordings"
  on storage.objects for select
  using (bucket_id = 'memory-recordings');
