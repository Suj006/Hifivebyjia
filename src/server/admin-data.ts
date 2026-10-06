import "server-only";
import { categories as fileCategories, collections as fileCollections } from "@/data/categories";
import { db } from "@/server/db";
import { defaultSettings } from "@/server/defaults";
import { rowToDiscount, rowToProduct, rowToReview } from "@/server/mappers";
import type { AppliedDiscount, Category, Collection, CustomerDetails, Discount, OrderStatus, Product, Review, StoreSettings } from "@/types";

/* ------------------------------ Types ------------------------------ */

export interface AdminOrderLine {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customisation: Record<string, string> | null;
}

export interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customer: CustomerDetails;
  lines: AdminOrderLine[];
  totals: {
    subtotal: number;
    discounts: AppliedDiscount[];
    discountTotal: number;
    shipping: number;
    tax: number;
    total: number;
    couponError: string | null;
  };
  couponCode: string | null;
  clientTotal: number | null;
  note: string;
  stockAdjusted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotifyRow {
  id: number;
  email: string;
  topic: string;
  productId: string | null;
  createdAt: string;
  notifiedAt: string | null;
}

export interface MessageRow {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

function rowToOrder(row: Record<string, unknown>): AdminOrder {
  return {
    id: String(row.id),
    reference: String(row.reference),
    status: row.status as OrderStatus,
    customer: row.customer as CustomerDetails,
    lines: row.lines as AdminOrderLine[],
    totals: row.totals as AdminOrder["totals"],
    couponCode: (row.coupon_code as string | null) ?? null,
    clientTotal: (row.client_total as number | null) ?? null,
    note: String(row.note ?? ""),
    stockAdjusted: Boolean(row.stock_adjusted),
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

/* ------------------------------ Products ------------------------------ */

export async function listProducts(): Promise<Product[]> {
  const sql = await db();
  const rows = await sql`select * from products order by sort_order, created_at`;
  return rows.map(rowToProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const sql = await db();
  const [row] = await sql`select * from products where id = ${id}`;
  return row ? rowToProduct(row) : null;
}

/* ------------------------------ Discounts ------------------------------ */

export async function listDiscounts(): Promise<Discount[]> {
  const sql = await db();
  const rows = await sql`select * from discounts order by created_at desc`;
  return rows.map(rowToDiscount);
}

export async function getDiscount(id: string): Promise<Discount | null> {
  const sql = await db();
  const [row] = await sql`select * from discounts where id = ${id}`;
  return row ? rowToDiscount(row) : null;
}

/* ------------------------------ Orders ------------------------------ */

export async function listOrders(status?: string): Promise<AdminOrder[]> {
  const sql = await db();
  const rows = status
    ? await sql`select * from orders where status = ${status} order by created_at desc limit 500`
    : await sql`select * from orders order by created_at desc limit 500`;
  return rows.map(rowToOrder);
}

export async function getOrder(id: string): Promise<AdminOrder | null> {
  const sql = await db();
  const [row] = await sql`select * from orders where id = ${id}`;
  return row ? rowToOrder(row) : null;
}

/* ------------------------------ Reviews ------------------------------ */

export async function listReviews(status?: string): Promise<Review[]> {
  const sql = await db();
  const rows = status
    ? await sql`select * from reviews where status = ${status} order by created_at desc limit 500`
    : await sql`select * from reviews order by created_at desc limit 500`;
  return rows.map(rowToReview);
}

/* ------------------------------ Inbox ------------------------------ */

export async function listNotifyRequests(): Promise<NotifyRow[]> {
  const sql = await db();
  const rows = await sql`select * from notify_requests order by created_at desc limit 2000`;
  return rows.map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    topic: String(r.topic),
    productId: (r.product_id as string | null) ?? null,
    createdAt: iso(r.created_at)!,
    notifiedAt: iso(r.notified_at),
  }));
}

export async function listMessages(): Promise<MessageRow[]> {
  const sql = await db();
  const rows = await sql`select * from messages order by created_at desc limit 500`;
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    email: String(r.email),
    message: String(r.message),
    read: Boolean(r.read),
    createdAt: iso(r.created_at)!,
  }));
}

/* ------------------------------ Settings ------------------------------ */

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const sql = await db();
  const [row] = await sql`select value from settings where key = ${key}`;
  return (row?.value as T) ?? fallback;
}

export const getStoreSettings = async (): Promise<StoreSettings> => ({
  ...defaultSettings(),
  ...(await getSetting<Partial<StoreSettings>>("store", {})),
});
export const getAllCollections = () => getSetting<Collection[]>("collections", fileCollections);
export const getAllCategories = () => getSetting<Category[]>("categories", fileCategories);

/* ------------------------------ Dashboard ------------------------------ */

export async function getDashboard() {
  const sql = await db();
  const [counts] = await sql`
    select
      (select count(*) from orders where status = 'requested')::int as new_orders,
      (select count(*) from orders where created_at > now() - interval '30 days' and status <> 'cancelled')::int as orders_30d,
      (select coalesce(sum((totals->>'total')::int), 0) from orders where created_at > now() - interval '30 days' and status not in ('cancelled', 'requested'))::int as revenue_30d,
      (select count(*) from reviews where status = 'pending')::int as pending_reviews,
      (select count(*) from messages where not read)::int as unread_messages,
      (select count(*) from notify_requests where notified_at is null)::int as subscribers,
      (select count(*) from products where status = 'active')::int as active_products`;
  const lowStock = (await sql`
    select * from products where status = 'active' and (data->>'stock')::int <= 3 order by (data->>'stock')::int limit 8`).map(rowToProduct);
  const recentOrders = (await sql`select * from orders order by created_at desc limit 6`).map(rowToOrder);
  return {
    newOrders: Number(counts.new_orders),
    orders30d: Number(counts.orders_30d),
    revenue30d: Number(counts.revenue_30d),
    pendingReviews: Number(counts.pending_reviews),
    unreadMessages: Number(counts.unread_messages),
    subscribers: Number(counts.subscribers),
    activeProducts: Number(counts.active_products),
    lowStock,
    recentOrders,
  };
}
