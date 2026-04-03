-- Legacy Letters feature
-- Letters written today, delivered in the future — even after the sender passes away.

create type public.letter_type as enum ('annual', 'milestone');
create type public.letter_status as enum ('draft', 'scheduled', 'pending_release', 'released', 'printed', 'delivered');

create table public.letters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.recipients(id) on delete cascade,
  letter_type public.letter_type not null,
  title text not null,
  content text not null default '',
  scheduled_date date,
  milestone_label text,
  status public.letter_status default 'draft' not null,
  stripe_payment_intent_id text,
  amount_paid integer not null default 0,
  executor_email text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.letters enable row level security;

create policy "Users can view own letters"
  on public.letters for select
  using (auth.uid() = user_id);

create policy "Users can insert own letters"
  on public.letters for insert
  with check (auth.uid() = user_id);

create policy "Users can update own letters"
  on public.letters for update
  using (auth.uid() = user_id);

create policy "Users can delete own draft letters"
  on public.letters for delete
  using (auth.uid() = user_id and status = 'draft');

-- Auto-update updated_at
create or replace function public.update_letters_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger letters_updated_at
  before update on public.letters
  for each row execute function public.update_letters_updated_at();
