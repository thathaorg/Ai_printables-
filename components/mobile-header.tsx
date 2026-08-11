"use client";

import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export default function MobileHeader({ onMenuToggle, isMenuOpen }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[color-mix(in_oklab,var(--ink)_8%,transparent)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="text-[var(--ink)]"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <BrandLogo size={34} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--coral)] px-3.5 py-2 text-sm font-display font-semibold text-white shadow-[0_3px_0_0_color-mix(in_oklab,var(--ink)_16%,transparent)] border-2 border-[color-mix(in_oklab,var(--ink)_14%,transparent)] hover:-translate-y-0.5 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create
          </Link>
        </div>
      </div>
    </header>
  );
}
