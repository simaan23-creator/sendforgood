-- Add business fields to profiles
alter table public.profiles
  add column account_type text default 'personal' not null,
  add column company_name text,
  add column company_website text,
  add column industry text;

-- Business orders table
create table public.business_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  sender_name text,
  status public.order_status default 'active' not null,
  created_at timestamptz default now() not null
);

alter table public.business_orders enable row level security;

create policy "Users can manage own business orders"
  on public.business_orders for all
  using (auth.uid() = user_id);

-- Business recipients table (extends recipients for bulk)
create table public.business_recipients (
  id uuid primary key default uuid_generate_v4(),
  business_order_id uuid not null references public.business_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  relationship text,
  occasion_type public.occasion_type not null,
  occasion_date date not null,
  occasion_label text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  tier public.gift_tier not null,
  years_purchased integer not null check (years_purchased >= 1),
  card_message text,
  gift_notes text,
  stripe_payment_intent_id text,
  amount_paid integer,
  status public.order_status default 'active' not null,
  created_at timestamptz default now() not null
);

alter table public.business_recipients enable row level security;

create policy "Users can manage own business recipients"
  on public.business_recipients for all
  using (auth.uid() = user_id);
