import { db, isDatabaseConfigured } from "@/server/db";

/**
 * Serves product photos uploaded in the admin dashboard. Each upload gets a
 * new id, so responses can be cached forever.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured() || !/^img-[a-z0-9]+$/.test(id)) return new Response("Not found", { status: 404 });
  const sql = await db();
  const [row] = await sql`select content_type, bytes from images where id = ${id}`;
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = row.bytes as Uint8Array;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": String(row.content_type),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
