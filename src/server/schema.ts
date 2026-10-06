import "server-only";
import type postgres from "postgres";
import { collections as seedCollections, categories as seedCategories } from "@/data/categories";
import { discounts as seedDiscounts } from "@/data/discounts";
import { products as seedProducts } from "@/data/products";
import { reviews as seedReviews } from "@/data/reviews";
import { defaultSettings } from "@/server/defaults";

/**
 * Database schema. Tables are created automatically on first use and filled
 * with the products, collections and offers from `src/data` exactly once.
 * Product and coupon details are stored as JSON so new fields need no migration.
 */
const STATEMENTS = [
  `create table if not exists products (
    id text primary key,
    slug text not null unique,
    status text not null,
    sort_order int not null default 0,
    data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists images (
    id text primary key,
    content_type text not null,
    bytes bytea not null,
    width int,
    height int,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists discounts (
    id text primary key,
    code text unique,
    data jsonb not null,
    usage_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists orders (
    id text primary key,
    reference text not null unique,
    status text not null default 'requested',
    customer jsonb not null,
    lines jsonb not null,
    totals jsonb not null,
    coupon_code text,
    client_total int,
    note text not null default '',
    stock_adjusted boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists reviews (
    id text primary key,
    product_id text not null,
    name text not null,
    rating int not null check (rating between 1 and 5),
    title text,
    text text not null,
    status text not null default 'pending',
    featured boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists notify_requests (
    id bigserial primary key,
    email text not null,
    topic text not null,
    product_id text,
    created_at timestamptz not null default now(),
    notified_at timestamptz
  )`,
  `create unique index if not exists notify_requests_unique on notify_requests (email, topic, coalesce(product_id, ''))`,
  `create table if not exists messages (
    id bigserial primary key,
    name text not null,
    email text not null,
    message text not null,
    read boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
  )`,
  `create index if not exists orders_created_idx on orders (created_at desc)`,
  `create index if not exists reviews_product_idx on reviews (product_id, status)`,
];

export async function migrate(sql: postgres.Sql) {
  await sql.begin(async (tx) => {
    // Serialise concurrent cold starts / build workers.
    await tx`select pg_advisory_xact_lock(515151)`;
    for (const statement of STATEMENTS) await tx.unsafe(statement);

    const [seeded] = await tx`select 1 from settings where key = 'seeded'`;
    if (seeded) return;

    for (const p of seedProducts) {
      const { id, slug, status, sortOrder, createdAt, updatedAt, ...rest } = p;
      await tx`
        insert into products (id, slug, status, sort_order, data, created_at, updated_at)
        values (${id}, ${slug}, ${status}, ${sortOrder ?? 0}, ${tx.json(rest as never)}, ${createdAt}, ${updatedAt})
        on conflict (id) do nothing`;
    }
    for (const d of seedDiscounts) {
      const { id, usageCount, ...rest } = d;
      await tx`
        insert into discounts (id, code, data, usage_count)
        values (${id}, ${d.code ? d.code.toUpperCase() : null}, ${tx.json(rest as never)}, ${usageCount ?? 0})
        on conflict do nothing`;
    }
    for (const r of seedReviews) {
      await tx`
        insert into reviews (id, product_id, name, rating, title, text, status, featured, created_at)
        values (${r.id}, ${r.productId}, ${r.name}, ${r.rating}, ${r.title ?? null}, ${r.text}, ${r.status}, ${r.featured ?? false}, ${r.createdAt})
        on conflict do nothing`;
    }
    const initial: Record<string, unknown> = {
      collections: seedCollections,
      categories: seedCategories,
      store: defaultSettings(),
      seeded: { at: new Date().toISOString() },
    };
    for (const [key, value] of Object.entries(initial)) {
      await tx`insert into settings (key, value) values (${key}, ${tx.json(value as never)}) on conflict (key) do nothing`;
    }
  });
}
