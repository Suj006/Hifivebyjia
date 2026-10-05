# Deployment: GitHub → Vercel → GoDaddy DNS → hifivebyjia.in

No GoDaddy hosting or VPS is needed. GoDaddy only manages the domain's DNS records.

## 1. GitHub

The code lives in the GitHub repository. Every push to the default branch triggers a production deploy;
other branches get preview URLs.

## 2. Vercel

1. Sign in at vercel.com with GitHub → **Add New… → Project** → import the repository.
2. Framework preset: **Next.js** (auto-detected). Build command `next build`, output default.
3. **Environment Variables** (Production + Preview) — see `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` = `https://hifivebyjia.in`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = business number, digits only, e.g. `919876543210`
   - optional: `FORMS_WEBHOOK_URL`, `FORMS_WEBHOOK_SECRET`, analytics IDs
4. Deploy. You'll get a `*.vercel.app` URL to test.

> `NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.

## 3. Connect the domain

In Vercel → Project → **Settings → Domains**, add `hifivebyjia.in` and `www.hifivebyjia.in`
(set `hifivebyjia.in` as primary; `www` redirects to it).

## 4. GoDaddy DNS

GoDaddy → **My Products → hifivebyjia.in → DNS → Manage DNS**. Add / replace:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | the IP Vercel shows (currently `76.76.21.21`) | 1 hour |
| CNAME | `www` | the value Vercel shows (e.g. `cname.vercel-dns.com`) | 1 hour |

Remove any conflicting `A` records for `@` and any GoDaddy "parked"/forwarding settings.
Always copy the exact values from the Vercel Domains screen — they are authoritative.

DNS can take from a few minutes up to 48 hours. Vercel issues the HTTPS certificate automatically.

## 5. After going live

- Google Search Console: add the property, verify (set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy),
  then submit `https://hifivebyjia.in/sitemap.xml`.
- Share links on Instagram bio: `https://hifivebyjia.in`.
