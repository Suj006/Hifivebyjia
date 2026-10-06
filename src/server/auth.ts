import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** For route handlers: returns a 401 response when not signed in. */
export async function adminGuard(request: Request): Promise<Response | null> {
  // Same-origin check for state-changing requests.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (request.method !== "GET" && origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Bad origin" }, { status: 403 });
  }
  if (!(await isAdmin())) return Response.json({ error: "Please sign in again." }, { status: 401 });
  return null;
}
