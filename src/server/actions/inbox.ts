"use server";

import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { refreshStore } from "@/server/store";
import { ORDER_STATUSES, RESERVES_STOCK } from "@/lib/order-status";
import { sanitizeText } from "@/lib/validation";
import type { OrderStatus, ReviewStatus } from "@/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/* ------------------------------ Orders ------------------------------ */

/**
 * Updates an order's status / note. Moving an order into a confirmed state
 * reduces stock once; cancelling a confirmed order puts the stock back.
 */
export async function updateOrder(id: string, status: OrderStatus, note: string): Promise<ActionResult> {
  await requireAdmin();
  if (!ORDER_STATUSES.some((s) => s.value === status)) return { ok: false, error: "Unknown status." };
  const sql = await db();
  let message = "Saved.";
  let found = true;
  await sql.begin(async (tx) => {
    const [order] = await tx`select lines, stock_adjusted from orders where id = ${id} for update`;
    if (!order) {
      found = false;
      return;
    }
    const lines = order.lines as { productId: string; quantity: number }[];
    let adjusted = Boolean(order.stock_adjusted);
    const reserve = RESERVES_STOCK.includes(status);
    if (reserve && !adjusted) {
      for (const l of lines) {
        await tx`
          update products set data = jsonb_set(data, '{stock}', to_jsonb(greatest(0, coalesce((data->>'stock')::int, 0) - ${l.quantity}))), updated_at = now()
          where id = ${l.productId}`;
      }
      adjusted = true;
      message = "Saved. Stock reduced for the items in this order.";
    } else if (!reserve && adjusted) {
      for (const l of lines) {
        await tx`
          update products set data = jsonb_set(data, '{stock}', to_jsonb(coalesce((data->>'stock')::int, 0) + ${l.quantity})), updated_at = now()
          where id = ${l.productId}`;
      }
      adjusted = false;
      message = "Saved. Stock put back for the items in this order.";
    }
    await tx`
      update orders set status = ${status}, note = ${sanitizeText(note, 2000)}, stock_adjusted = ${adjusted}, updated_at = now()
      where id = ${id}`;
  });
  if (!found) return { ok: false, error: "Order not found." };
  refreshStore();
  return { ok: true, message };
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  await requireAdmin();
  const sql = await db();
  const [order] = await sql`select status from orders where id = ${id}`;
  if (order && order.status !== "cancelled" && order.status !== "requested") {
    return { ok: false, error: "Cancel the order first (this puts the stock back), then delete it." };
  }
  await sql`delete from orders where id = ${id}`;
  return { ok: true };
}

/* ------------------------------ Reviews ------------------------------ */

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!["pending", "approved", "rejected"].includes(status)) return { ok: false, error: "Unknown status." };
  const sql = await db();
  await sql`update reviews set status = ${status} where id = ${id}`;
  refreshStore();
  return { ok: true };
}

export async function toggleReviewFeatured(id: string): Promise<ActionResult> {
  await requireAdmin();
  const sql = await db();
  await sql`update reviews set featured = not featured where id = ${id}`;
  refreshStore();
  return { ok: true };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  await requireAdmin();
  const sql = await db();
  await sql`delete from reviews where id = ${id}`;
  refreshStore();
  return { ok: true };
}

/* ------------------------------ Notify-me ------------------------------ */

export async function markNotified(ids: number[]): Promise<ActionResult> {
  await requireAdmin();
  const list = ids.map(Number).filter(Number.isInteger).slice(0, 2000);
  if (!list.length) return { ok: true };
  const sql = await db();
  await sql`update notify_requests set notified_at = now() where id in ${sql(list)}`;
  return { ok: true };
}

export async function deleteNotify(id: number): Promise<ActionResult> {
  await requireAdmin();
  const sql = await db();
  await sql`delete from notify_requests where id = ${Number(id)}`;
  return { ok: true };
}

/* ------------------------------ Messages ------------------------------ */

export async function setMessageRead(id: number, read: boolean): Promise<ActionResult> {
  await requireAdmin();
  const sql = await db();
  await sql`update messages set read = ${read} where id = ${Number(id)}`;
  return { ok: true };
}

export async function deleteMessage(id: number): Promise<ActionResult> {
  await requireAdmin();
  const sql = await db();
  await sql`delete from messages where id = ${Number(id)}`;
  return { ok: true };
}
