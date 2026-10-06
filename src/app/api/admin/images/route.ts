import { NextResponse } from "next/server";
import { adminGuard } from "@/server/auth";
import { db, newId } from "@/server/db";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

/** Uploads one product photo (already resized in the browser) and returns its URL. */
export async function POST(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo received." }, { status: 400 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: "Please upload a JPG, PNG or WebP photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "This photo is too large (max 4 MB)." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check the file really is an image (magic bytes), not just named like one.
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) return NextResponse.json({ error: "This file doesn’t look like a photo." }, { status: 400 });

  const width = Math.min(10000, Math.max(1, Math.round(Number(form.get("width")) || 1200)));
  const height = Math.min(10000, Math.max(1, Math.round(Number(form.get("height")) || 1200)));
  const id = newId("img").replace(/[^a-z0-9-]/g, "");
  const sql = await db();
  await sql`insert into images (id, content_type, bytes, width, height) values (${id}, ${file.type}, ${bytes}, ${width}, ${height})`;
  return NextResponse.json({ src: `/api/images/${id}`, width, height });
}
