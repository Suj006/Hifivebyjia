# Architecture & Phase 2 roadmap

## Current architecture

- **Database.** PostgreSQL (Neon via Vercel, Supabase or any Postgres) through `postgres` (postgres.js).
  `src/server/schema.ts` creates the tables on first use and seeds them once from `src/data`. Products and
  discounts are stored as JSON documents (`data jsonb`) plus indexed columns, so new fields need no migration.
  Uploaded photos are stored as `bytea` and served by `/api/images/[id]` with immutable caching.
- **Store loader.** `src/server/store.ts` loads everything the storefront needs (`StoreData`) in one cached call
  (`unstable_cache`, tag `store`). Pages stay fully static; every admin mutation calls `refreshStore()`
  (`revalidateTag` + `revalidatePath('/', 'layout')`) so changes appear immediately. Without `DATABASE_URL` the
  loader returns the data files instead.
- **Client data.** `ShopChrome` passes `StoreData` into a `StoreProvider` for client components (cart, search,
  filters). Coupon codes are **not** included — the cart asks `/api/coupons` for the one code a customer typed.
- **Pricing engine.** `calculateTotals()` (pure) runs in the browser for the cart and again on the server when an
  order is placed (`src/server/submissions.ts`), using database prices, coupon rules and shipping settings.
- **Admin.** `/admin` (route group `(panel)`), protected by `src/proxy.ts` + `requireAdmin()` in every page and
  server action. Login uses `ADMIN_PASSWORD`; sessions are HMAC-signed cookies (`src/lib/admin-session.ts`).
  Mutations are Server Actions in `src/server/actions/*`, each validating input on the server.
- **Client state.** Cart, saved-for-later and wishlist stay in `localStorage` (`useSyncExternalStore`), ready to
  sync with customer accounts later.

## Phase 2 plan

### Fuller relational schema
The live schema is in `src/server/schema.ts`. [`database-schema.sql`](database-schema.sql) and `src/types/models.ts`
sketch a fuller relational model for later (customer accounts, payments, shipments). Tables cover users, products,
categories, collections, product images, reviews, wishlists, carts & cart items, orders & order items,
payments, coupons/discounts, inventory movements, shipments, creator profiles & creator products,
notifications and notify-me subscriptions. Row Level Security keeps customer data private; admin writes use
the service role on the server only.

Inventory, orders, reviews, coupons and the admin dashboard already exist; Phase 2 adds accounts and payments
on top of the same tables.

### Customer accounts
Supabase Auth (email OTP / Google). On sign-in, merge the local cart, saved items and wishlist into the
`carts` / `wishlists` tables (`persistent-store` subscribers make this a small adapter).

### Payments (Razorpay) — see `src/lib/payments.ts`
Cart → coupon → address → shipping → GST → server re-pricing → Razorpay order → UPI/Card →
signature verification → order created → inventory reduced → confirmation. Webhooks are the source of truth.
The checkout UI already has the "Online Payment" option slot and `siteConfig.checkout.onlinePaymentEnabled`.

### Orders, shipping & GST
- Order statuses: `pending_payment → paid → packed → shipped → delivered` (+ `cancelled`, `refunded`).
- Shipping: replace `siteConfig.shipping` with a rate provider (Shiprocket or similar) + tracking numbers.
- GST: set `hsn`, `gstRate`, `taxCategory` per product once confirmed, then `siteConfig.tax.enabled = true`.
  The engine already supports inclusive/exclusive pricing.

### Reviews & Verified Purchase
Delivered order → review request email/WhatsApp (opt-in) → review stored `pending` with `order_id` →
admin approves → published with **Verified Purchase** (only when linked to a delivered order of that product).
The badge is wired in `ProductReviews` behind `siteConfig.features.customerAccounts`.

### Notifications & abandoned cart
Email (Resend/SES) and WhatsApp Business API for order updates. Abandoned-cart reminders only for customers who
opted in, with frequency caps and one-click unsubscribe — no intrusive marketing.

### Admin dashboard (built — next steps)
Already live: products & photos, stock, collections, categories, coupons/offers, orders with stock adjustment,
review moderation, Notify-me lists, messages, shipping & WhatsApp settings. Next: multiple admin users with
roles (instead of one shared password), customers list, sales reports/analytics, GST invoices, creator profiles.

### Instagram feed
`InstagramSection` currently links product tiles to the profile. Phase 2 can fetch the Instagram Graph API on the
server (token in env, cached with revalidation) and render the latest posts in the same grid.

### Creator marketplace (long term)
Hi Five by Jia → creator profiles → creator products → **parent/guardian approval** → product approval →
customer orders. `Product.creatorId` and the `creator_*` tables are ready. Every creator under 18 requires
verified guardian consent; creators' personal details are never published.

## Security notes
- No secrets in client code; server-only env vars (`DATABASE_URL`, `ADMIN_PASSWORD`, `FORMS_WEBHOOK_URL`).
- Admin: password compared in constant time, login rate-limited, HMAC-signed httpOnly session cookie, checked in
  the proxy **and** in every admin page, server action and admin API (same-origin check on uploads).
- All inputs validated client-side and re-validated/sanitised server-side; SQL is always parameterised.
- Uploads: type + magic-byte check, 4 MB limit, resized in the browser; CSV export neutralises formulas.
- Coupon codes never reach the browser except the one a customer types; orders are re-priced on the server.
- Honeypot + per-IP rate limiting on forms and coupon checks; security headers in `next.config.ts`.
- No card/UPI data is collected.
