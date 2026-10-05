/**
 * Central site configuration.
 *
 * Every brand/contact/commerce setting lives here (or comes from an
 * environment variable read here). Do not duplicate these values elsewhere.
 */

/**
 * Environment values. NEXT_PUBLIC_* variables must be referenced literally
 * (process.env.NEXT_PUBLIC_X) so Next.js can inline them into browser code.
 */
const clean = (value: string | undefined, fallback = "") => (value && value.trim() ? value.trim() : fallback);

export const siteConfig = {
  name: "Hi 5 by Jia",
  shortName: "Hi 5",
  url: clean(process.env.NEXT_PUBLIC_SITE_URL, "https://hifivebyjia.in").replace(/\/$/, ""),
  tagline: "Made with Creativity. Shared with a Smile.",
  footerTagline: "Handmade accessories. Big ideas. One Hi 5 at a time.",
  description:
    "Discover handmade bracelets, personalised accessories, gifts and creative collections from Hi 5 by Jia. Made with creativity and shared with a smile.",
  defaultTitle: "Hi 5 by Jia | Handmade Bracelets & Accessories",
  locale: "en_IN",
  language: "en-IN",

  /**
   * Official logo — `public/brand/logo.jpg`, used exactly as supplied
   * (no recolouring, cropping, redrawing or effects). Only scaled for display.
   */
  logo: { src: "/brand/logo.jpg", width: 1254, height: 1254, alt: "Hi 5 by Jia logo" } as null | {
    src: string;
    width: number;
    height: number;
    alt: string;
  },

  contact: {
    email: "hifivebyjia@gmail.com",
    /**
     * Business WhatsApp number in international format without "+" or spaces,
     * e.g. 919876543210. Set NEXT_PUBLIC_WHATSAPP_NUMBER in Vercel.
     * Never use a child's personal number.
     */
    whatsappNumber: clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER).replace(/[^\d]/g, ""),
  },

  social: {
    instagram: {
      handle: "@hifivebyjia",
      url: "https://www.instagram.com/hifivebyjia/",
    },
  },

  commerce: {
    currency: "INR",
    currencySymbol: "₹",
    country: "IN",
    /** Max quantity of a single line in the cart. */
    maxQuantityPerLine: 20,
  },

  /**
   * Shipping (Phase 1 estimate only). Confirm these values before launch.
   * Phase 2 can replace this with courier rates (e.g. Shiprocket).
   */
  shipping: {
    enabled: true,
    standardRate: 50,
    freeShippingThreshold: 499,
    label: "Standard shipping (India)",
    estimateNote: "Final shipping is confirmed with your order.",
    dispatchTime: "2–4 working days",
    deliveryTime: "4–8 working days after dispatch",
  },

  /**
   * GST/tax. Disabled until HSN codes and GST rates are confirmed.
   * When enabled, per-product `gstRate` is used, falling back to `defaultRate`.
   */
  tax: {
    enabled: false,
    pricesIncludeTax: true,
    defaultRate: null as number | null,
    disabledLabel: "To be confirmed",
  },

  checkout: {
    onlinePaymentEnabled: false,
    orderReferencePrefix: "H5",
  },

  analytics: {
    googleAnalyticsId: clean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    metaPixelId: clean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    googleSiteVerification: clean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
  },

  features: {
    creatorMarketplace: false,
    instagramFeed: false,
    customerAccounts: false,
  },
} as const;

export type SiteConfig = typeof siteConfig;

export const absoluteUrl = (path = "/") =>
  `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
