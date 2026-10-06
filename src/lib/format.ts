import { siteConfig } from "@/config/site";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: siteConfig.commerce.currency,
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export const formatPrice = (amount: number) => inr.format(Math.round(amount));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const discountPercent = (price: number, compareAt?: number) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

export const pluralise = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

/** Date + time in India time, e.g. "6 Oct 2026, 4:30 pm". */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
