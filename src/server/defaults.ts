import { siteConfig } from "@/config/site";
import type { StoreSettings } from "@/types";

/** Initial shop settings (editable later in Admin → Settings). */
export function defaultSettings(): StoreSettings {
  return {
    whatsappNumber: siteConfig.contact.whatsappNumber,
    shippingEnabled: siteConfig.shipping.enabled,
    standardShippingRate: siteConfig.shipping.standardRate,
    freeShippingThreshold: siteConfig.shipping.freeShippingThreshold,
    dispatchTime: siteConfig.shipping.dispatchTime,
    deliveryTime: siteConfig.shipping.deliveryTime,
  };
}
