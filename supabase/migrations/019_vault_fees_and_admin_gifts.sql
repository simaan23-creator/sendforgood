-- Vault fees: tracks $10 vault creation fees (from purchases or admin gifts)
create table if not exists vault_fees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  source text not null,        -- 'purchase' | 'admin_gift'
  source_id text,              -- stripe payment intent or admin_vault_gift id
  used_at timestamptz,         -- null = available, set when vault is created
  created_at timestamptz default now()
);

alter table vault_fees enable row level security;
create policy "Users can read own vault fees" on vault_fees for select using (auth.uid() = user_id);

-- Admin vault gifts: gift packages sent by admin to friends
create table if not exists admin_vault_gifts (
  id uuid primary key default gen_random_uuid(),
  recipient_name text not null,
  recipient_email text not null,
  audio_credits int default 0,
  video_credits int default 0,
  photo_credits int default 0,
  message text,
  claim_code text unique not null,
  status text default 'pending',   -- 'pending' | 'claimed'
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  created_at timestamptz default now()
);
