/**
 * Shared input validation for client forms and API routes.
 * Keep rules here so the browser and the server agree.
 */
import type { CustomerDetails, CustomisationField, CustomisationValues } from "@/types";

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;
const PIN_RE = /^[1-9]\d{5}$/;

export const sanitizeText = (value: unknown, max = 1000): string =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/[<>]/g, "")
        .trim()
        .slice(0, max)
    : "";

export const isEmail = (v: string) => EMAIL_RE.test(v.trim());
export const isMobile = (v: string) => MOBILE_RE.test(v.replace(/\s|-/g, ""));
export const isPincode = (v: string) => PIN_RE.test(v.trim());

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export function validateCustomer(c: CustomerDetails): FieldErrors<keyof CustomerDetails> {
  const e: FieldErrors<keyof CustomerDetails> = {};
  if (c.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!isMobile(c.mobile)) e.mobile = "Please enter a valid 10-digit Indian mobile number.";
  if (!isEmail(c.email)) e.email = "Please enter a valid email address.";
  if (c.address.trim().length < 8) e.address = "Please enter your full delivery address.";
  if (c.city.trim().length < 2) e.city = "Please enter your city.";
  if (!INDIAN_STATES.includes(c.state)) e.state = "Please choose your state.";
  if (!isPincode(c.pincode)) e.pincode = "Please enter a valid 6-digit PIN code.";
  return e;
}

export function validateCustomisation(
  fields: CustomisationField[] | undefined,
  values: CustomisationValues,
): FieldErrors {
  const e: FieldErrors = {};
  for (const f of fields ?? []) {
    const v = (values[f.id] ?? "").trim();
    if (f.required && !v) {
      e[f.id] = f.type === "select" ? `Please choose a ${f.label.toLowerCase()}.` : `Please enter ${f.label.toLowerCase()}.`;
      continue;
    }
    if (!v) continue;
    if (f.maxLength && v.length > f.maxLength) e[f.id] = `Maximum ${f.maxLength} characters.`;
    else if (f.pattern && !new RegExp(f.pattern, "u").test(v)) e[f.id] = f.patternMessage ?? "Please check this field.";
    else if (f.type === "select" && f.options && !f.options.includes(v)) e[f.id] = "Please choose an option.";
  }
  return e;
}

export interface ReviewInput {
  productId: string;
  name: string;
  rating: number;
  title?: string;
  text: string;
}

export function validateReview(r: ReviewInput): FieldErrors<keyof ReviewInput> {
  const e: FieldErrors<keyof ReviewInput> = {};
  if (!r.productId) e.productId = "Missing product.";
  if (r.name.trim().length < 2) e.name = "Please enter your name (first name is fine).";
  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) e.rating = "Please choose a star rating.";
  if (r.text.trim().length < 10) e.text = "Please write at least 10 characters.";
  if (r.text.length > 1000) e.text = "Please keep your review under 1000 characters.";
  return e;
}

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export function validateContact(c: ContactInput): FieldErrors<keyof ContactInput> {
  const e: FieldErrors<keyof ContactInput> = {};
  if (c.name.trim().length < 2) e.name = "Please enter your name.";
  if (!isEmail(c.email)) e.email = "Please enter a valid email address.";
  if (c.message.trim().length < 10) e.message = "Please write a little more (at least 10 characters).";
  if (c.message.length > 2000) e.message = "Please keep your message under 2000 characters.";
  return e;
}

export const hasErrors = (e: object) => Object.keys(e).length > 0;
