"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/format";
import { logout } from "@/server/actions/auth";

export interface NavCounts {
  newOrders: number;
  pendingReviews: number;
  unreadMessages: number;
}

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: "newOrders" as const },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/coupons", label: "Coupons & offers", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star, count: "pendingReviews" as const },
  { href: "/admin/subscribers", label: "Notify-me list", icon: Bell },
  { href: "/admin/messages", label: "Messages", icon: Mail, count: "unreadMessages" as const },
  { href: "/admin/collections", label: "Collections", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ counts }: { counts: NavCounts | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const links = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 p-3">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const count = item.count && counts ? counts[item.count] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition",
              active ? "bg-pink-soft text-pink-deep" : "text-ink hover:bg-[#F3EDF5]",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-pink-deep px-1.5 text-xs font-bold text-white">{count}</span>
            )}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 border-t border-line pt-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold text-ink hover:bg-[#F3EDF5]">
          <ExternalLink className="h-5 w-5" aria-hidden /> View website
        </a>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold text-ink hover:bg-[#F3EDF5]">
            <LogOut className="h-5 w-5" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-2 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display font-bold">
          <Logo asLink={false} className="h-10" sizes="40px" /> Admin
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-pink-soft" aria-label="Open admin menu" aria-expanded={open}>
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-3">
              <span className="font-display text-lg font-bold">Hi Five Admin</span>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-pink-soft" aria-label="Close menu">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {links}
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <Link href="/admin" className="flex items-center gap-3 border-b border-line p-4">
          <Logo asLink={false} className="h-14" sizes="56px" />
          <span className="font-display text-lg leading-tight font-bold">
            Hi Five
            <br />
            <span className="text-sm text-ink-soft">Admin</span>
          </span>
        </Link>
        {links}
      </aside>
    </>
  );
}
