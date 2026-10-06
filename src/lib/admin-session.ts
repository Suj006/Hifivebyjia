/**
 * Admin session tokens: `<expiry>.<HMAC-SHA256 signature>`.
 *
 * The signing key is derived from ADMIN_PASSWORD (+ optional
 * ADMIN_SESSION_SECRET), so changing the password signs everyone out.
 * Uses Web Crypto so it works in both the proxy and server code.
 */
export const ADMIN_COOKIE = "h5_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

export const isAdminPasswordSet = () => Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8);

async function signingKey() {
  const material = `h5-admin|${process.env.ADMIN_PASSWORD ?? ""}|${process.env.ADMIN_SESSION_SECRET ?? ""}`;
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(material));
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

export async function createSessionToken(): Promise<string> {
  const expires = String(Date.now() + SESSION_MAX_AGE * 1000);
  const sig = await crypto.subtle.sign("HMAC", await signingKey(), enc.encode(expires));
  return `${expires}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !isAdminPasswordSet()) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || !/^\d+$/.test(expires) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  if (Number(expires) < Date.now()) return false;
  return crypto.subtle.verify("HMAC", await signingKey(), fromHex(sig), enc.encode(expires));
}

/** Constant-time password check (compares SHA-256 digests). */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !isAdminPasswordSet()) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(candidate)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
