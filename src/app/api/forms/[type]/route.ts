/**
 * Form endpoint: reviews, notify-me, contact messages and order requests.
 *
 * - Validates and sanitises input on the server.
 * - Drops obvious bots (honeypot field `website`) and rate-limits per IP.
 * - Saves to the database (shown in the admin dashboard) when DATABASE_URL is
 *   set, and also forwards to FORMS_WEBHOOK_URL when that is configured.
 * - Reviews are always stored as "pending" — nothing is published automatically.
 */
import { NextResponse } from "next/server";
import { getProductById } from "@/server/products-lookup";
import { isDatabaseConfigured } from "@/server/db";
import { rateLimited } from "@/server/rate-limit";
import { createMessage, createNotify, createOrder, createReview } from "@/server/submissions";
import { hasErrors, isEmail, sanitizeText, validateContact, validateReview } from "@/lib/validation";
import type { CartLine, CustomerDetails } from "@/types";

const TYPES = ["review", "notify", "contact", "order"] as const;
type FormType = (typeof TYPES)[number];

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

async function forward(type: FormType, data: unknown): Promise<boolean> {
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
  if (rateLimited(`form:${ip}`, 8, 60_000)) return bad("Too many requests. Please wait a minute and try again.", 429);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 50_000) return bad("Request too large.", 413);

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

  const hasDb = isDatabaseConfigured();
  let data: Record<string, unknown>;

  try {
    switch (type as FormType) {
      case "review": {
        const review = {
          productId: sanitizeText(body.productId, 80),
          name: sanitizeText(body.name, 60),
          rating: Number(body.rating),
          title: sanitizeText(body.title, 100),
          text: sanitizeText(body.text, 1000),
        };
        if (hasErrors(validateReview(review)) || !(await getProductById(review.productId))) {
          return bad("Please check your review and try again.");
        }
        if (hasDb) await createReview(review);
        data = { ...review, status: "pending" };
        break;
      }
      case "notify": {
        const notify = {
          email: sanitizeText(body.email, 120).toLowerCase(),
          topic: sanitizeText(body.topic, 40),
          productId: sanitizeText(body.productId, 80) || undefined,
        };
        if (!isEmail(notify.email)) return bad("Please enter a valid email address.");
        if (!["product", "creator-collaborations", "newsletter"].includes(notify.topic)) return bad("Unknown topic.");
        if (notify.productId && !(await getProductById(notify.productId))) return bad("Unknown product.");
        if (hasDb) await createNotify(notify);
        data = notify;
        break;
      }
      case "contact": {
        const contact = {
          name: sanitizeText(body.name, 80),
          email: sanitizeText(body.email, 120),
          message: sanitizeText(body.message, 2000),
        };
        if (hasErrors(validateContact(contact))) return bad("Please check the form and try again.");
        if (hasDb) await createMessage(contact);
        data = contact;
        break;
      }
      case "order": {
        const order = {
          reference: sanitizeText(body.reference, 40),
          customer: (body.customer ?? {}) as CustomerDetails,
          lines: (Array.isArray(body.lines) ? body.lines : []) as CartLine[],
          couponCode: typeof body.couponCode === "string" ? body.couponCode : null,
          clientTotal: Number(body.clientTotal) || 0,
        };
        if (hasDb) {
          const res = await createOrder(order);
          if (!res.ok) return bad(res.error);
        }
        data = { reference: order.reference, customer: order.customer, lines: order.lines, couponCode: order.couponCode, estimatedTotal: order.clientTotal };
        break;
      }
    }
  } catch (err) {
    console.error(`[forms:${type}]`, err);
    return bad("Sorry, something went wrong on our side. Please try again.", 500);
  }

  const forwarded = await forward(type as FormType, data);
  return NextResponse.json({ ok: true, delivered: hasDb || forwarded });
}
