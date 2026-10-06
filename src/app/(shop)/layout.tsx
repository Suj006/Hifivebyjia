import { ShopChrome } from "@/components/layout/ShopChrome";

export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ShopChrome>{children}</ShopChrome>;
}
