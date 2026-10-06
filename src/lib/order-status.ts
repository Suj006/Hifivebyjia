import type { OrderStatus } from "@/types";

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: "yellow" | "blue" | "green" | "purple" | "pink" | "grey"; help: string }[] = [
  { value: "requested", label: "New request", tone: "yellow", help: "Customer sent the order. Confirm availability on WhatsApp." },
  { value: "confirmed", label: "Confirmed", tone: "blue", help: "You confirmed the order. Stock is reduced automatically." },
  { value: "paid", label: "Paid", tone: "purple", help: "Payment received." },
  { value: "packed", label: "Packed", tone: "purple", help: "Packed and ready to ship." },
  { value: "shipped", label: "Shipped", tone: "blue", help: "On its way to the customer." },
  { value: "delivered", label: "Delivered", tone: "green", help: "Delivered. Ask for a review!" },
  { value: "cancelled", label: "Cancelled", tone: "grey", help: "Cancelled. Stock is put back automatically." },
];

export const orderStatusInfo = (s: OrderStatus) => ORDER_STATUSES.find((x) => x.value === s) ?? ORDER_STATUSES[0];

/** Statuses after confirmation reserve stock. */
export const RESERVES_STOCK: OrderStatus[] = ["confirmed", "paid", "packed", "shipped", "delivered"];
