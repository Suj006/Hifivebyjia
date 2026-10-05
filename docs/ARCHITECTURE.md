# Architecture & Phase 2 roadmap

## Phase 1 (current)

- **Static first.** Every page is pre-rendered at build time (products and collections via
  `generateStaticParams`). The only server code is `/api/forms/[type]`.
- **Data layer.** `src/data/*` holds products, collections, discounts and approved reviews. Components never
  import these directly — they go through `src/lib/catalog.ts`, `src/lib/reviews.ts` and `src/lib/pricing.ts`,
  so Phase 2 can swap in database queries without touching UI.
- **Client state.** `src/lib/persistent-store.ts` is a tiny `useSyncExternalStore` store backed by
  `localStorage` (cart, saved-for-later, wishlist, pending reviews, notify-me, order requests). It is
  hydration-safe (server snapshot = empty) and syncs across tabs.
- **Pricing engine.** `calculateTotals()` is a pure function: lines + catalogue + coupon → subtotal, discounts,
  shipping, tax, total. The same function will run on the server in Phase 2 to re-verify totals before payment —
  client totals are never trusted for charging.
- **Submissions.** `src/lib/repositories` validates, stores locally and POSTs to the API route, which
  re-validates and forwards to an optional webhook.

## Phase 2 plan

### Database (Supabase / PostgreSQL)
See [`database-schema.sql`](database-schema.sql) and `src/types/models.ts`. Tables cover users, products,
categories, collections, product images, reviews, wishlists, carts & cart items, orders & order items,
payments, coupons/discounts, inventory movements, shipments, creator profiles & creator products,
notifications and notify-me subscriptions. Row Level Security keeps customer data private; admin writes use
the service role on the server only.

Migration path: replace function bodies in `src/lib/catalog.ts` / `src/lib/reviews.ts` with Supabase queries
(server components can stay async) and switch product pages to ISR (`revalidate`) or on-demand revalidation
from the admin dashboard.

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

### Admin dashboard
`/admin` behind Supabase Auth + role check: products, categories, collections, inventory, prices, discounts,
coupons, orders, customers, review moderation (approve / reject / delete / feature — the local preview at
`/admin/reviews` mirrors these actions), coming-soon products, creator collaborations, shipping, GST, analytics.

### Instagram feed
`InstagramSection` currently links product tiles to the profile. Phase 2 can fetch the Instagram Graph API on the
server (token in env, cached with revalidation) and render the latest posts in the same grid.

### Creator marketplace (long term)
Hi 5 by Jia → creator profiles → creator products → **parent/guardian approval** → product approval →
customer orders. `Product.creatorId` and the `creator_*` tables are ready. Every creator under 18 requires
verified guardian consent; creators' personal details are never published.

## Security notes
- No secrets in client code; server-only env vars (`FORMS_WEBHOOK_URL`, future Razorpay/Supabase keys).
- All inputs validated client-side and re-validated/sanitised server-side (`src/lib/validation.ts`).
- Honeypot + per-IP rate limiting on forms; security headers in `next.config.ts`.
- No card/UPI data is collected in Phase 1.
