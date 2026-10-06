import { NextResponse } from "next/server";
import { rateLimited } from "@/server/rate-limit";
import { lookupCoupon } from "@/server/submissions";

/**
 * Checks a coupon code for the cart. Codes live only on the server, so
 * secret codes can't be read from the website's source.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(`coupon:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    return NextResponse.json(await lookupCoupon(code));
  } catch (err) {
    console.error("[coupons]", err);
    return NextResponse.json({ error: "Couldn’t check this code right now. Please try again." }, { status: 500 });
  }
}
