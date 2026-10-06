# Deployment: GitHub → Vercel → GoDaddy DNS → hifivebyjia.in

No GoDaddy hosting or VPS is needed. GoDaddy only manages the domain's DNS records.

## 1. GitHub

The code lives in the GitHub repository. Every push to `main` triggers a production deploy;
other branches get preview URLs.

## 2. Vercel project

1. Sign in at vercel.com with GitHub → **Add New… → Project** → import the repository.
2. Framework preset: **Next.js** (auto-detected). Keep the default build settings.

## 3. Database (for the admin dashboard)

1. In the Vercel project → **Storage** → **Create Database** → **Neon (Serverless Postgres)** → free plan →
   region **Mumbai (ap-south-1)** or **Singapore** → connect it to the project (Production + Preview).
2. Vercel adds `DATABASE_URL` / `POSTGRES_URL` automatically. Nothing else to do — tables are created
   and filled with the current products, collections and coupons on the first visit.

Prefer Supabase or another Postgres? Paste its connection string as `DATABASE_URL` (use the pooled/transaction URL).

Photos uploaded in admin are stored in the database (each ~100–300 KB). Neon’s free 0.5 GB holds
thousands of photos.

## 4. Environment variables

Vercel → Project → **Settings → Environment Variables** (see `.env.example`):

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A strong password (12+ characters) for `/admin`. **Required for admin.** |
| `NEXT_PUBLIC_SITE_URL` | `https://hifivebyjia.in` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Optional fallback — the number can also be set in Admin → Settings |
| `ADMIN_SESSION_SECRET` | Optional extra random string for signing admin sessions |
| `FORMS_WEBHOOK_URL` | Optional — also forward submissions to a Google Sheet/Formspree/Make |
| analytics IDs | Optional — see `.env.example` |

Then **Deployments → Redeploy** so the new variables are used.

> Changing `ADMIN_PASSWORD` signs everyone out of admin (after a redeploy).

## 5. Connect the domain

In Vercel → Project → **Settings → Domains**, add `hifivebyjia.in` and `www.hifivebyjia.in`
(set `hifivebyjia.in` as primary; `www` redirects to it).

## 6. GoDaddy DNS

GoDaddy → **My Products → hifivebyjia.in → DNS → Manage DNS**. Add / replace:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | the IP Vercel shows (currently `76.76.21.21`) | 1 hour |
| CNAME | `www` | the value Vercel shows (e.g. `cname.vercel-dns.com`) | 1 hour |

Remove any conflicting `A` records for `@` and any GoDaddy “parked”/forwarding settings.
Always copy the exact values from the Vercel Domains screen — they are authoritative.

DNS can take from a few minutes up to 48 hours. Vercel issues the HTTPS certificate automatically.

## 7. After going live

- Visit `https://hifivebyjia.in/admin`, sign in, and check **Settings** (WhatsApp number, shipping).
- Google Search Console: add the property, verify (set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy),
  then submit `https://hifivebyjia.in/sitemap.xml`.
- Put `https://hifivebyjia.in` in the Instagram bio.

## Running locally with a database (optional)

```bash
# any local Postgres, e.g. Docker:
docker run -d --name h5-db -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
# .env.local
DATABASE_URL=postgres://postgres:dev@localhost:5432/postgres
ADMIN_PASSWORD=choose-a-local-password
npm run dev   # then open http://localhost:3000/admin
```

Without `DATABASE_URL` the website still runs from the files in `src/data`, and `/admin` shows setup instructions.
