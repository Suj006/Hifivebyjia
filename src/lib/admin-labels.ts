import type { ProductStatus } from "@/types";

export const PRODUCT_STATUS_INFO: Record<ProductStatus, { label: string; tone: "green" | "purple" | "grey" | "pink" | "yellow"; help: string }> = {
  active: { label: "On sale", tone: "green", help: "Visible and can be ordered." },
  coming_soon: { label: "Coming soon", tone: "purple", help: "Visible with “Notify me”, can’t be ordered yet." },
  sold_out: { label: "Sold out", tone: "pink", help: "Visible, shows “Sold out” and “Notify me”." },
  draft: { label: "Hidden (draft)", tone: "grey", help: "Not visible on the website." },
  discontinued: { label: "Discontinued", tone: "grey", help: "No longer sold. Not visible on the website." },
};
