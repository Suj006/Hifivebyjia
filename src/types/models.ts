/**
 * Future (Phase 2) database models — mirrors docs/database-schema.sql.
 * Not used at runtime in Phase 1; kept here so new features target one shape.
 */
import type { Audience, ProductStatus, ReviewStatus } from "@/types";

type UUID = string;
type Timestamp = string;

export interface UserRow {
  id: UUID;
  email: string;
  name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  marketingOptIn: boolean;
  createdAt: Timestamp;
}

export interface ProductRow {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  categoryId: UUID;
  audience: Audience[];
  tags: string[];
  sku: string;
  status: ProductStatus;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  customisable: boolean;
  customisationSchema: unknown | null;
  weightGrams: number | null;
  dimensions: unknown | null;
  hsn: string | null;
  gstRate: number | null;
  taxCategory: string | null;
  creatorId: UUID | null;
  launchDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductImageRow {
  id: UUID;
  productId: UUID;
  url: string;
  alt: string;
  kind: string | null;
  position: number;
  width: number;
  height: number;
}

export interface InventoryRow {
  productId: UUID;
  stock: number;
  reserved: number;
  updatedAt: Timestamp;
}

export interface CartRow {
  id: UUID;
  userId: UUID | null;
  couponCode: string | null;
  updatedAt: Timestamp;
}

export interface CartItemRow {
  id: UUID;
  cartId: UUID;
  productId: UUID;
  quantity: number;
  customisation: Record<string, string> | null;
  savedForLater: boolean;
}

export type OrderStatus = "pending_payment" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderRow {
  id: UUID;
  reference: string;
  userId: UUID | null;
  status: OrderStatus;
  customer: Record<string, string>;
  subtotal: number;
  discountTotal: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  createdAt: Timestamp;
}

export interface OrderItemRow {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  name: string;
  unitPrice: number;
  quantity: number;
  customisation: Record<string, string> | null;
  hsn: string | null;
  gstRate: number | null;
}

export interface PaymentRow {
  id: UUID;
  orderId: UUID;
  provider: "razorpay";
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: number;
  status: "created" | "captured" | "failed" | "refunded";
  createdAt: Timestamp;
}

export interface ShipmentRow {
  id: UUID;
  orderId: UUID;
  courier: string | null;
  trackingNumber: string | null;
  status: "pending" | "shipped" | "delivered" | "returned";
  shippedAt: Timestamp | null;
  deliveredAt: Timestamp | null;
}

export interface ReviewRow {
  id: UUID;
  productId: UUID;
  userId: UUID | null;
  orderId: UUID | null;
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  text: string;
  photoUrl: string | null;
  status: ReviewStatus;
  featured: boolean;
  verifiedPurchase: boolean;
  createdAt: Timestamp;
}

export interface CreatorProfileRow {
  id: UUID;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isMinor: boolean;
  guardianConsentAt: Timestamp | null;
  status: "pending" | "approved" | "paused";
  createdAt: Timestamp;
}

export interface NotificationRow {
  id: UUID;
  userId: UUID | null;
  email: string | null;
  channel: "email" | "whatsapp";
  template: string;
  payload: unknown;
  sentAt: Timestamp | null;
}
