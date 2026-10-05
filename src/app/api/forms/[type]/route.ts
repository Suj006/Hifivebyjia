/**
 * Phase 1 form endpoint: reviews, notify-me, contact messages and order requests.
 *
 * - Validates and sanitises input on the server.
 * - Drops obvious bots (honeypot field `website`) and rate-limits per IP.
 * - Forwards accepted submissions to FORMS_WEBHOOK_URL (server-only secret)
 *   when configured. Nothing is published automatically — reviews always
 *   arrive with status "pending".
 *
 * Phase 2: replace `forward()` with database inserts (Supabase) and emails.
 */
import { NextResponse } from "next/server";
import { getProductById } from "@/lib/catalog";
import {
  hasErrors,
  isEmail,
  sanitizeText,
  validateContact,
  validateCustomer,
  validateReview,
} from "@/lib/validation";
import type { CustomerDetails } from "@/types";

const TYPES = ["review", "notify", "contact", "order"] as const;
type FormType = (typeof TYPES)[number];

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

function clean(type: FormType, body: Record<string, unknown>): { data?: Record<string, unknown>; error?: string } {
  switch (type) {
    case "review": {
      const data = {
        productId: sanitizeText(body.productId, 80),
        name: sanitizeText(body.name, 60),
        rating: Number(body.rating),
        title: sanitizeText(body.title, 100),
        text: sanitizeText(body.text, 1000),
        status: "pending",
      };
      if (hasErrors(validateReview(data)) || !getProductById(data.productId)) return { error: "Please check your review and try again." };
      return { data };
    }
    case "notify": {
      const data = {
        email: sanitizeText(body.email, 120).toLowerCase(),
        topic: sanitizeText(body.topic, 40),
        productId: sanitizeText(body.productId, 80) || undefined,
      };
      if (!isEmail(data.email)) return { error: "Please enter a valid email address." };
      if (!["product", "creator-collaborations", "newsletter"].includes(data.topic)) return { error: "Unknown topic." };
      if (data.productId && !getProductById(data.productId)) return { error: "Unknown product." };
      return { data };
    }
    case "contact": {
      const data = {
        name: sanitizeText(body.name, 80),
        email: sanitizeText(body.email, 120),
        message: sanitizeText(body.message, 2000),
      };
      if (hasErrors(validateContact(data))) return { error: "Please check the form and try again." };
      return { data };
    }
    case "order": {
      const c = (body.customer ?? {}) as Record<string, unknown>;
      const customer: CustomerDetails = {
        name: sanitizeText(c.name, 80),
        mobile: sanitizeText(c.mobile, 20),
        email: sanitizeText(c.email, 120),
        address: sanitizeText(c.address, 300),
        city: sanitizeText(c.city, 80),
        state: sanitizeText(c.state, 80),
        pincode: sanitizeText(c.pincode, 10),
        notes: sanitizeText(c.notes, 500),
      };
      if (hasErrors(validateCustomer(customer))) return { error: "Please check your details." };
      const lines = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
      if (!lines.length) return { error: "Your order is empty." };
      return {
        data: {
          reference: sanitizeText(body.reference, 40),
          customer,
          lines: lines.map((l: Record<string, unknown>) => ({
            productId: sanitizeText(l.productId, 80),
            name: sanitizeText(l.name, 120),
            quantity: Number(l.quantity) || 0,
            customisation: l.customisation,
          })),
          // Client-side estimate only; Phase 2 recalculates on the server.
          estimatedTotal: Number(body.total) || 0,
        },
      };
    }
  }
}

async function forward(type: FormType, data: Record<string, unknown>): Promise<boolean> {
  const url = process.env.FORMS_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.FORMS_WEBHOOK_SECRET ? { "X-Webhook-Secret": process.env.FORMS_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({ type, receivedAt: new Date().toISOString(), data }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type as FormType)) return bad("Not found", 404);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return bad("Too many requests. Please wait a minute and try again.", 429);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) return bad("Request too large.", 413);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: humans never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const { data, error } = clean(type as FormType, body);
  if (!data) return bad(error ?? "Invalid request.");

  const delivered = await forward(type as FormType, data);
  return NextResponse.json({ ok: true, delivered });
}
