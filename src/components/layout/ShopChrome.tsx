import type { ReactNode } from "react";
import { JsonLd } from "@/components/common/JsonLd";
import { Toaster } from "@/components/common/Toaster";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getStore } from "@/server/store";
import { StoreProvider } from "@/store/store-context";

/** Storefront frame: store data for client components, header, footer and toasts. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  const store = await getStore();
  return (
    <StoreProvider store={store}>
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-ink px-5 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={store.settings} />
      <Toaster />
    </StoreProvider>
  );
}
