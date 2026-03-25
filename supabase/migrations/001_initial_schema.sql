-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recipients table
create table public.recipients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  relationship text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  created_at timestamptz default now() not null
);

alter table public.recipients enable row level security;

create policy "Users can manage own recipients"
  on public.recipients for all
  using (auth.uid() = user_id);

-- Occasions table
create type public.occasion_type as enum (
  'birthday', 'graduation', 'holiday', 'anniversary', 'just_because', 'custom'
);

create table public.occasions (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.recipients(id) on delete cascade,
  type public.occasion_type not null,
  occasion_date date not null,
  label text,
  created_at timestamptz default now() not null
);

alter table public.occasions enable row level security;

create policy "Users can manage occasions for own recipients"
  on public.occasions for all
  using (
    recipient_id in (
      select id from public.recipients where user_id = auth.uid()
    )
  );

-- Orders table
create type public.order_status as enum ('active', 'paused', 'cancelled', 'completed');
create type public.gift_tier as enum ('starter', 'classic', 'premium', 'deluxe', 'legacy');

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.recipients(id) on delete cascade,
  occasion_id uuid not null references public.occasions(id) on delete cascade,
  tier public.gift_tier not null,
  years_purchased integer not null check (years_purchased >= 1),
  years_remaining integer not null check (years_remaining >= 0),
  amount_paid integer not null,
  stripe_payment_intent_id text,
  status public.order_status default 'active' not null,
  created_at timestamptz default now() not null
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- Shipments table
create type public.shipment_status as enum ('pending', 'shipped', 'delivered');

create table public.shipments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  scheduled_date date not null,
  status public.shipment_status default 'pending' not null,
  tracking_number text,
  gift_description text,
  created_at timestamptz default now() not null
);

alter table public.shipments enable row level security;

create policy "Users can view shipments for own orders"
  on public.shipments for select
  using (
    order_id in (
      select id from public.orders where user_id = auth.uid()
    )
  );

-- Gift catalog table
create table public.gift_catalog (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  tier public.gift_tier not null,
  price integer not null,
  occasion_tags text[] default '{}',
  image_url text,
  active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.gift_catalog enable row level security;

create policy "Anyone can view active catalog items"
  on public.gift_catalog for select
  using (active = true);

-- Seed some gift catalog items
insert into public.gift_catalog (name, description, tier, price, occasion_tags, image_url) values
  ('Heartfelt Card', 'A beautifully designed greeting card with a personal touch and a collectible keepsake card.', 'starter', 2900, '{"birthday","holiday","anniversary","just_because"}', '/gifts/starter-card.jpg'),
  ('Birthday Wishes Card', 'Premium birthday card with a collectible mini art print.', 'starter', 2900, '{"birthday"}', '/gifts/starter-birthday.jpg'),
  ('Holiday Greetings Set', 'Festive holiday card with a limited edition collectible card.', 'starter', 2900, '{"holiday"}', '/gifts/starter-holiday.jpg'),

  ('Curated Small Gift', 'A thoughtfully selected small gift with a matching card, beautifully wrapped.', 'classic', 4900, '{"birthday","anniversary","just_because"}', '/gifts/classic-gift.jpg'),
  ('Graduation Keepsake', 'A special keepsake gift celebrating their achievement, with a congratulations card.', 'classic', 4900, '{"graduation"}', '/gifts/classic-grad.jpg'),
  ('Holiday Surprise Box', 'A seasonal wrapped gift with a festive card and holiday treats.', 'classic', 4900, '{"holiday"}', '/gifts/classic-holiday.jpg'),

  ('Premium Gift Box', 'A curated gift box with multiple items, a personalized card, and premium packaging.', 'premium', 7900, '{"birthday","anniversary","just_because","graduation"}', '/gifts/premium-box.jpg'),
  ('Anniversary Celebration Box', 'Elegant gift box with curated items for celebrating milestones together.', 'premium', 7900, '{"anniversary"}', '/gifts/premium-anniversary.jpg'),
  ('Holiday Delights Box', 'Premium holiday gift box with artisanal treats, candles, and festive items.', 'premium', 7900, '{"holiday"}', '/gifts/premium-holiday.jpg'),

  ('Personalized Luxury Gift', 'A premium gift matched to the recipient''s interests with a preview photo sent to you before shipping.', 'deluxe', 12900, '{"birthday","anniversary","just_because","graduation"}', '/gifts/deluxe-personalized.jpg'),
  ('Milestone Celebration Gift', 'A luxury gift tailored for special milestones with a preview photo before delivery.', 'deluxe', 12900, '{"birthday","graduation","anniversary"}', '/gifts/deluxe-milestone.jpg'),

  ('Legacy Experience Box', 'The ultimate gift — luxury item, premium packaging, a handwritten letter, and a curated unboxing experience.', 'legacy', 19900, '{"birthday","anniversary","just_because","graduation","holiday"}', '/gifts/legacy-experience.jpg'),
  ('Legacy Love Letter Box', 'A luxury gift with a beautifully handwritten letter, premium box, and a memorable unboxing moment.', 'legacy', 19900, '{"anniversary","just_because"}', '/gifts/legacy-love.jpg');
