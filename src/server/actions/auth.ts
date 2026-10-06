"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, SESSION_MAX_AGE, createSessionToken, isAdminPasswordSet, passwordMatches } from "@/lib/admin-session";
import { rateLimited } from "@/server/rate-limit";

export interface LoginState {
  error?: string;
}

const safeNext = (value: unknown) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminPasswordSet()) {
    return { error: "Admin password is not set up yet. Add ADMIN_PASSWORD (8+ characters) in Vercel → Settings → Environment Variables." };
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(`login:${ip}`, 5, 10 * 60_000)) {
    return { error: "Too many attempts. Please wait 10 minutes and try again." };
  }
  const password = String(formData.get("password") ?? "");
  if (!(await passwordMatches(password))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password isn’t right. Please try again." };
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
