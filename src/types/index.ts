/**
 * Core domain types used by the Phase 1 storefront.
 *
 * These mirror the future database tables described in `src/types/models.ts`
 * and `docs/database-schema.sql`, so swapping the local data files for
 * Supabase/PostgreSQL in Phase 2 does not require frontend changes.
 */

export type ProductStatus = "active" | "coming_soon" | "sold_out" | "draft" | "discontinued";

export type Audience = "kids" | "teens" | "adults" | "women" | "families" | "everyone";

export type ProductImageKind =
  | "front"
  | "back"
  | "close-up"
  | "packaging"
  | "lifestyle"
  | "detail"
  | "size-reference";

export interface ProductImage {
  src: string;
  alt: string;
  kind?: ProductImageKind;
  width: number;
  height: number;
}

export interface Dimensions {
  /** All measurements in centimetres. */
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  /** For bracelets: inner circumference. */
  circumferenceCm?: number;
}

export type CustomisationFieldType = "text" | "select" | "textarea";

export interface CustomisationField {
  id: string;
  label: string;
  type: CustomisationFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  /** Restrict characters, e.g. letters only for alphabet beads. */
  pattern?: string;
  patternMessage?: string;
  options?: string[];
  /** Optional extra cost added per unit when the field is filled. */
  priceAdjustment?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  /** Selling price in whole rupees (INR). */
  price: number;
  /** Original price when the product is on offer. */
  compareAtPrice?: number;
  /** Derived for display, but stored so the admin can set it explicitly. */
  discountPercentage?: number;
  images: ProductImage[];
  /** Primary category slug (see `src/data/categories.ts`). */
  category: string;
  /** Collection slugs this product belongs to. */
  collections: string[];
  audience: Audience[];
  tags: string[];
  stock: number;
  sku: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  customisable: boolean;
  customisation?: CustomisationField[];
  status: ProductStatus;
  /** Weight in grams (used for shipping in Phase 2). */
  weight?: number;
  dimensions?: Dimensions;
  /** HSN code – to be confirmed before GST is enabled. */
  hsn?: string;
  /** GST rate in percent. Leave `null` until the classification is confirmed. */
  gstRate: number | null;
  taxCategory?: string;
  /** Expected launch date (ISO) for coming-soon products. */
  launchDate?: string;
  /** Friendly launch label, e.g. "Coming this winter". */
  launchLabel?: string;
  /** Sample listings that demonstrate the design and should be replaced. */
  isSample?: boolean;
  /** Creator attribution, ready for future creator collaborations. */
  creatorId?: string;
  /** Lower sorts first within "Featured". */
  sortOrder?: number;
  materials?: string[];
  care?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
}

export interface CollectionRule {
  audience?: Audience[];
  category?: string[];
  tags?: string[];
}

export interface Collection {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  /** Tailwind gradient classes for the collection card. */
  theme: CollectionTheme;
  /** Optional automatic membership rule (in addition to `product.collections`). */
  rule?: CollectionRule;
  sortOrder: number;
  visible: boolean;
}

export type CollectionTheme = "pink" | "sunny" | "sky" | "grape" | "mint" | "tangerine";

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  text: string;
  photoUrl?: string;
  createdAt: string;
  status: ReviewStatus;
  featured?: boolean;
  /** Phase 2 only – set when the review is linked to a delivered order. */
  verifiedPurchase?: boolean;
  orderId?: string;
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

export type CustomisationValues = Record<string, string>;

export interface CartLine {
  /** Unique per product + customisation combination. */
  lineId: string;
  productId: string;
  quantity: number;
  customisation?: CustomisationValues;
  addedAt: string;
}

export interface SavedItem {
  lineId: string;
  productId: string;
  quantity: number;
  customisation?: CustomisationValues;
  savedAt: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

/* ------------------------------------------------------------------ */
/* Discounts                                                           */
/* ------------------------------------------------------------------ */

export type DiscountValueType = "percentage" | "fixed";

export type DiscountScope =
  | { type: "order" }
  | { type: "products"; productIds: string[] }
  | { type: "categories"; categories: string[] }
  | { type: "collections"; collections: string[] };

export interface BuyXGetY {
  /** Units that must be bought from the scope. */
  buyQuantity: number;
  /** Units that are discounted. */
  getQuantity: number;
  /** Percentage off the "get" units (100 = free). */
  getDiscountPercent: number;
}

export interface Discount {
  id: string;
  /** Coupon code. Omit for automatic offers. */
  code?: string;
  label: string;
  description: string;
  kind: "standard" | "buy_x_get_y";
  valueType: DiscountValueType;
  /** Percent (0–100) or rupees, depending on `valueType`. */
  value: number;
  scope: DiscountScope;
  buyXGetY?: BuyXGetY;
  minimumOrder?: number;
  maximumDiscount?: number;
  startsAt?: string;
  endsAt?: string;
  firstOrderOnly?: boolean;
  /** Automatic offers apply without a code (e.g. limited-time sale). */
  automatic?: boolean;
  active: boolean;
}

export interface AppliedDiscount {
  discountId: string;
  label: string;
  code?: string;
  amount: number;
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export interface PricedLine {
  lineId: string;
  product: Product;
  quantity: number;
  customisation?: CustomisationValues;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
}

export interface CartTotals {
  lines: PricedLine[];
  itemCount: number;
  subtotal: number;
  discounts: AppliedDiscount[];
  discountTotal: number;
  shipping: number;
  shippingLabel: string;
  freeShippingRemaining: number;
  tax: number;
  taxLabel: string;
  total: number;
  couponError?: string;
}

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

export interface CustomerDetails {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

export type PaymentMethod = "whatsapp" | "online";

export interface OrderRequest {
  reference: string;
  createdAt: string;
  customer: CustomerDetails;
  lines: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    customisation?: CustomisationValues;
  }>;
  subtotal: number;
  discountTotal: number;
  discounts: AppliedDiscount[];
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: "requested";
}

export interface NotifyRequest {
  email: string;
  productId?: string;
  topic: "product" | "creator-collaborations" | "newsletter";
  createdAt: string;
}
