"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, BookOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "create", label: "Create", icon: Sparkles, href: "/create" },
  { id: "how", label: "How", icon: BookOpen, href: "/how-to-use" },
  { id: "limits", label: "Free", icon: Info, href: "/dashboard" },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/free") || pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 md:hidden">
      <div className="paper-panel-lift flex items-center justify-around rounded-[1.75rem] px-2 py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-w-[4.25rem] flex-col items-center justify-center rounded-2xl px-2 py-1.5 transition-all duration-200",
                isActive
                  ? "bg-[var(--kiwi)] text-white shadow-[0_3px_0_0_color-mix(in_oklab,var(--ink)_16%,transparent)]"
                  : "text-[var(--ink-soft)] hover:bg-[var(--muted)]"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="mt-0.5 font-display text-[11px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
