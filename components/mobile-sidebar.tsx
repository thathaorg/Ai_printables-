"use client";

import {
  X,
  HelpCircle,
  Info,
  Mail,
  Home as HomeIcon,
  PenTool,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Home", icon: HomeIcon, href: "/" },
  { label: "Create", icon: PenTool, href: "/create" },
  { label: "How to Use", icon: HelpCircle, href: "/how-to-use" },
  { label: "About Us", icon: Info, href: "/about-us" },
  { label: "Parent tips", icon: Mail, href: "/parenting-newsletter" },
  { label: "Contact", icon: MessageCircle, href: "/contact-us" },
];

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 transform border-r border-border bg-[var(--paper)] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <BrandLogo size={32} href="/" />
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 font-medium hover:bg-[var(--muted)]"
                >
                  <Icon className="h-5 w-5 text-[var(--kiwi)]" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/terms"
              onClick={onClose}
              className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--ink-soft)] hover:bg-[var(--muted)]"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--ink-soft)] hover:bg-[var(--muted)]"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
