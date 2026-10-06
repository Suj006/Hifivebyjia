import { AdminNav, type NavCounts } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/server/auth";
import { db, isDatabaseConfigured } from "@/server/db";

async function navCounts(): Promise<NavCounts | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const sql = await db();
    const [row] = await sql`
      select
        (select count(*) from orders where status = 'requested')::int as new_orders,
        (select count(*) from reviews where status = 'pending')::int as pending_reviews,
        (select count(*) from messages where not read)::int as unread_messages`;
    return { newOrders: row.new_orders, pendingReviews: row.pending_reviews, unreadMessages: row.unread_messages };
  } catch {
    return null;
  }
}

export default async function AdminPanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  const counts = await navCounts();
  return (
    <div className="lg:flex">
      <AdminNav counts={counts} />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{isDatabaseConfigured() ? children : <DatabaseSetup />}</div>
      </main>
    </div>
  );
}

function DatabaseSetup() {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-10">
      <h1 className="font-display text-3xl font-bold">Connect your database (one-time setup)</h1>
      <p className="mt-2 text-ink-soft">
        The admin dashboard saves products, coupons, orders and reviews in a free PostgreSQL database. Until it’s connected, the website shows
        the products from the code files.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-6">
        <li>
          Open your project on <strong>vercel.com</strong> → <strong>Storage</strong> → <strong>Create Database</strong> → choose{" "}
          <strong>Neon (Postgres)</strong> → free plan → region <strong>Mumbai / Singapore</strong> → <strong>Connect</strong> to this project.
        </li>
        <li>
          Vercel adds the <code>DATABASE_URL</code> (or <code>POSTGRES_URL</code>) setting automatically. (Supabase or any Postgres also works —
          paste its connection string as <code>DATABASE_URL</code>.)
        </li>
        <li>
          <strong>Redeploy</strong> the project. Tables are created automatically and your current products, collections and coupons are copied in.
        </li>
      </ol>
    </div>
  );
}
