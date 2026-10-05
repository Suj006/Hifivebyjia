/**
 * Analytics-ready event helper.
 *
 * Events are sent only when the matching tracking ID is configured
 * (see `siteConfig.analytics` and `.env.example`). Nothing is tracked otherwise.
 */

type EventName =
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "add_to_wishlist"
  | "begin_checkout"
  | "whatsapp_order"
  | "search"
  | "apply_coupon"
  | "notify_me"
  | "submit_review"
  | "contact";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const META_EVENTS: Partial<Record<EventName, string>> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  search: "Search",
  contact: "Contact",
  notify_me: "Lead",
};

export function track(event: EventName, params: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    const meta = META_EVENTS[event];
    if (meta) window.fbq?.("track", meta, params);
  } catch {
    /* never let analytics break the shop */
  }
}
