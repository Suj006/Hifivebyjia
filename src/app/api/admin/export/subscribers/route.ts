import { listNotifyRequests, listProducts } from "@/server/admin-data";
import { adminGuard } from "@/server/auth";

const csv = (v: unknown) => {
  const s = String(v ?? "");
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const [rows, products] = await Promise.all([listNotifyRequests(), listProducts()]);
  const names = new Map(products.map((p) => [p.id, p.name]));
  const lines = [
    ["Email", "Topic", "Product", "Signed up", "Notified"].map(csv).join(","),
    ...rows.map((r) => [r.email, r.topic, r.productId ? names.get(r.productId) ?? r.productId : "", r.createdAt, r.notifiedAt ?? ""].map(csv).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="notify-me-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
