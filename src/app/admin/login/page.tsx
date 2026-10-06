import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminPasswordSet } from "@/lib/admin-session";
import { isAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="rounded-[2rem] bg-white p-2 shadow-soft">
            <Logo className="h-28" sizes="112px" asLink={false} />
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">Shop admin</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to manage products, coupons and orders.</p>
          {!isAdminPasswordSet() && (
            <p className="mt-4 rounded-2xl bg-sunny-soft p-3 text-sm">
              <strong>Setup needed:</strong> add an <code>ADMIN_PASSWORD</code> environment variable (at least 8 characters) in Vercel, then redeploy.
            </p>
          )}
          <LoginForm next={next ?? ""} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-soft">This area is private. Please don’t share the password.</p>
      </div>
    </div>
  );
}
