export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/categories" },
  { label: "Coming Soon", href: "/coming-soon" },
  { label: "About", href: "/about" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Shop all", href: "/shop" },
      { label: "Collections", href: "/categories" },
      { label: "Coming Soon", href: "/coming-soon" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Hi Five by Jia",
    links: [
      { label: "About Nainu", href: "/about" },
      { label: "Creator Collaborations", href: "/creator-collaborations" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
