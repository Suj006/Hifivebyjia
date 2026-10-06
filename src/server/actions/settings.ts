"use server";

import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { refreshStore } from "@/server/store";
import { sanitizeText } from "@/lib/validation";
import type { Audience, Collection, CollectionTheme, StoreSettings } from "@/types";

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const THEMES: CollectionTheme[] = ["pink", "sunny", "sky", "grape", "mint", "tangerine"];
const AUDIENCES: Audience[] = ["kids", "teens", "adults", "women", "families", "everyone"];

async function put(key: string, value: unknown) {
  const sql = await db();
  await sql`
    insert into settings (key, value, updated_at) values (${key}, ${sql.json(JSON.parse(JSON.stringify(value)) as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  refreshStore();
}

export async function saveStoreSettings(input: StoreSettings): Promise<SettingsResult> {
  await requireAdmin();
  const whatsappNumber = String(input.whatsappNumber ?? "").replace(/\D/g, "");
  if (whatsappNumber && (whatsappNumber.length < 11 || whatsappNumber.length > 15)) {
    return { ok: false, error: "Enter the WhatsApp number with country code, e.g. 919876543210 (or leave it empty)." };
  }
  const rate = Math.round(Number(input.standardShippingRate));
  const threshold = Math.round(Number(input.freeShippingThreshold));
  if (!(rate >= 0 && rate <= 10000) || !(threshold >= 0 && threshold <= 1000000)) {
    return { ok: false, error: "Shipping amounts must be 0 or more." };
  }
  const settings: StoreSettings = {
    whatsappNumber,
    shippingEnabled: Boolean(input.shippingEnabled),
    standardShippingRate: rate,
    freeShippingThreshold: threshold,
    dispatchTime: sanitizeText(input.dispatchTime, 60) || "2–4 working days",
    deliveryTime: sanitizeText(input.deliveryTime, 80) || "4–8 working days after dispatch",
  };
  await put("store", settings);
  return { ok: true };
}

export async function saveCollections(input: Collection[]): Promise<SettingsResult> {
  await requireAdmin();
  if (!Array.isArray(input) || input.length > 40) return { ok: false, error: "Too many collections." };
  const seen = new Set<string>();
  const collections: Collection[] = [];
  for (const [i, c] of input.entries()) {
    const name = sanitizeText(c.name, 40);
    const slug = sanitizeText(c.slug, 50).toLowerCase();
    if (!name) return { ok: false, error: `Collection ${i + 1} needs a name.` };
    if (!SLUG_RE.test(slug)) return { ok: false, error: `“${name}”: the web address can only use lowercase letters, numbers and dashes.` };
    if (seen.has(slug)) return { ok: false, error: `Two collections use the web address “${slug}”.` };
    seen.add(slug);
    collections.push({
      slug,
      name,
      tagline: sanitizeText(c.tagline, 80),
      description: sanitizeText(c.description, 300),
      emoji: sanitizeText(c.emoji, 8) || "✨",
      theme: THEMES.includes(c.theme) ? c.theme : "pink",
      rule: {
        ...(c.rule?.category?.length ? { category: c.rule.category.map((x) => sanitizeText(x, 50)).filter(Boolean) } : {}),
        ...(c.rule?.audience?.length ? { audience: c.rule.audience.filter((a) => AUDIENCES.includes(a)) } : {}),
        ...(c.rule?.tags?.length ? { tags: c.rule.tags.map((x) => sanitizeText(x, 30).toLowerCase()).filter(Boolean) } : {}),
      },
      sortOrder: i + 1,
      visible: Boolean(c.visible),
    });
  }
  await put("collections", collections);
  return { ok: true };
}
