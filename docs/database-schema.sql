-- Hi Five by Jia — Phase 2 database schema (Supabase / PostgreSQL). DRAFT — not applied yet.
-- Mirrors src/types/models.ts. Enable Row Level Security on every table before going live.

create extension if not exists "pgcrypto";

create type product_status as enum ('active', 'coming_soon', 'sold_out', 'draft', 'discontinued');
create type review_status as enum ('pending', 'approved', 'rejected');
create type order_status as enum ('pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');

create table users (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create table creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete set null,
  display_name text not null,
  bio text,
  avatar_url text,
  is_minor boolean not null default true,
  guardian_name text,                -- never shown publicly
  guardian_email text,               -- never shown publicly
  guardian_consent_at timestamptz,   -- required before any listing when is_minor
  status text not null default 'pending' check (status in ('pending', 'approved', 'paused')),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  emoji text,
  theme text,
  rule jsonb,
  sort_order int not null default 0,
  visible boolean not null default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  short_description text not null,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  category_id uuid references categories,
  audience text[] not null default '{}',
  tags text[] not null default '{}',
  sku text not null unique,
  status product_status not null default 'draft',
  featured boolean not null default false,
  bestseller boolean not null default false,
  new_arrival boolean not null default false,
  customisable boolean not null default false,
  customisation_schema jsonb,
  weight_grams int,
  dimensions jsonb,
  hsn text,
  gst_rate numeric(5,2),
  tax_category text,
  creator_id uuid references creator_profiles,
  launch_date timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_collections (
  product_id uuid references products on delete cascade,
  collection_id uuid references collections on delete cascade,
  primary key (product_id, collection_id)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  url text not null,
  alt text not null,
  kind text,
  position int not null default 0,
  width int,
  height int
);

create table inventory (
  product_id uuid primary key references products on delete cascade,
  stock int not null default 0 check (stock >= 0),
  reserved int not null default 0,
  updated_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products,
  change int not null,
  reason text not null,              -- 'order', 'restock', 'adjustment', 'return'
  order_id uuid,
  created_at timestamptz not null default now()
);

create table discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique,                  -- null for automatic offers
  label text not null,
  description text,
  kind text not null default 'standard' check (kind in ('standard', 'buy_x_get_y')),
  value_type text not null check (value_type in ('percentage', 'fixed')),
  value numeric(10,2) not null,
  scope jsonb not null,              -- { type: 'order' | 'products' | 'categories' | 'collections', ... }
  buy_x_get_y jsonb,
  minimum_order numeric(10,2),
  maximum_discount numeric(10,2),
  starts_at timestamptz,
  ends_at timestamptz,
  first_order_only boolean not null default false,
  usage_limit int,
  usage_count int not null default 0,
  automatic boolean not null default false,
  active boolean not null default true
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users on delete cascade,
  coupon_code text,
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts on delete cascade,
  product_id uuid not null references products,
  quantity int not null check (quantity > 0),
  customisation jsonb,
  saved_for_later boolean not null default false,
  added_at timestamptz not null default now()
);

create table wishlists (
  user_id uuid references users on delete cascade,
  product_id uuid references products on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references users,
  status order_status not null default 'pending_payment',
  customer jsonb not null,           -- name, mobile, email, address snapshot
  subtotal numeric(10,2) not null,
  discount_total numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid not null references products,
  name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null,
  customisation jsonb,
  hsn text,
  gst_rate numeric(5,2)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text not null,
  provider_payment_id text,
  amount numeric(10,2) not null,
  status text not null default 'created' check (status in ('created', 'captured', 'failed', 'refunded')),
  raw jsonb,
  created_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  courier text,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending', 'shipped', 'delivered', 'returned')),
  shipped_at timestamptz,
  delivered_at timestamptz
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  user_id uuid references users,
  order_id uuid references orders,
  name text not null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  text text not null,
  photo_url text,
  status review_status not null default 'pending',   -- never auto-published
  featured boolean not null default false,
  verified_purchase boolean not null default false,  -- set only for delivered orders
  created_at timestamptz not null default now()
);

create table notify_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topic text not null check (topic in ('product', 'creator-collaborations', 'newsletter')),
  product_id uuid references products on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (email, topic, product_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users,
  email text,
  channel text not null check (channel in ('email', 'whatsapp')),
  template text not null,
  payload jsonb,
  sent_at timestamptz
);

-- Public read access only to what the storefront needs.
alter table products enable row level security;
create policy "public products" on products for select using (status in ('active', 'sold_out', 'coming_soon'));
alter table reviews enable row level security;
create policy "public approved reviews" on reviews for select using (status = 'approved');
-- Customers can read their own orders/carts/wishlists; admin access via service role on the server.
