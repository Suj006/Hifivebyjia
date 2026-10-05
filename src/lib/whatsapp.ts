import { siteConfig } from "@/config/site";
import { getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { CartTotals, CustomerDetails, OrderRequest, Product } from "@/types";

export const isWhatsAppConfigured = () => Boolean(siteConfig.contact.whatsappNumber);

/** wa.me link. Falls back to a number-less share link when no number is configured. */
export function whatsappLink(message: string): string {
  const number = siteConfig.contact.whatsappNumber;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface MessageLine {
  name: string;
  quantity: number;
  lineTotal: number;
  details: string[];
}

interface MessageInput {
  lines: MessageLine[];
  subtotal: number;
  discounts: { label: string; code?: string; amount: number }[];
  shipping: number;
  tax: number;
  taxLabel?: string;
  total: number;
}

function customisationDetails(product: Product | undefined, values?: Record<string, string>): string[] {
  if (!product || !values) return [];
  return (product.customisation ?? [])
    .filter((f) => values[f.id]?.trim())
    .map((f) => `${f.label}: ${values[f.id].trim()}`);
}

function compose(input: MessageInput, customer?: Partial<CustomerDetails>, reference?: string): string {
  const lines: string[] = [`Hi ${siteConfig.name}! ✋`, "", "I’d like to place an order."];
  if (reference) lines.push(`Order reference: ${reference}`);
  lines.push("");

  for (const l of input.lines) {
    lines.push(`• ${l.name} × ${l.quantity} — ${formatPrice(l.lineTotal)}`);
    lines.push(...l.details.map((d) => `   ${d}`));
  }

  lines.push("", `Subtotal: ${formatPrice(input.subtotal)}`);
  for (const d of input.discounts) {
    lines.push(`Discount (${d.code ?? d.label}): −${formatPrice(d.amount)}`);
  }
  lines.push(`Shipping (estimate): ${input.shipping ? formatPrice(input.shipping) : "Free"}`);
  if (siteConfig.tax.enabled && input.tax) lines.push(`Tax${input.taxLabel ? ` (${input.taxLabel})` : ""}: ${formatPrice(input.tax)}`);
  lines.push(`Estimated total: ${formatPrice(input.total)}`);

  if (customer?.name) {
    lines.push("", "My details:", `Name: ${customer.name}`);
    if (customer.mobile) lines.push(`Mobile: ${customer.mobile}`);
    if (customer.email) lines.push(`Email: ${customer.email}`);
    const address = [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(", ");
    if (address) lines.push(`Address: ${address}`);
    if (customer.notes) lines.push(`Notes: ${customer.notes}`);
  }

  lines.push("", "Please confirm availability and next steps.");
  return lines.join("\n");
}

/** Message from live cart totals (cart quick order & checkout). */
export function buildOrderMessage(totals: CartTotals, customer?: Partial<CustomerDetails>, reference?: string): string {
  return compose(
    {
      lines: totals.lines
        .filter((l) => l.available)
        .map((l) => ({ name: l.product.name, quantity: l.quantity, lineTotal: l.lineTotal, details: customisationDetails(l.product, l.customisation) })),
      subtotal: totals.subtotal,
      discounts: totals.discounts,
      shipping: totals.shipping,
      tax: totals.tax,
      taxLabel: totals.taxLabel,
      total: totals.total,
    },
    customer,
    reference,
  );
}

/** Message from a saved order request (order confirmation page). */
export function buildOrderRequestMessage(order: OrderRequest): string {
  return compose(
    {
      lines: order.lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
        details: customisationDetails(getProductById(l.productId), l.customisation),
      })),
      subtotal: order.subtotal,
      discounts: order.discounts,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
    },
    order.customer,
    order.reference,
  );
}

export function buildProductEnquiry(product: Product): string {
  return `Hi ${siteConfig.name}! ✋\n\nI have a question about the ${product.name}.\n${siteConfig.url}/products/${product.slug}`;
}
