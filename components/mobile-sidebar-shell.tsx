"use client";

import { useState } from "react";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";

/** Lightweight shell so legal/support pages get header + drawer without repeating boilerplate. */
export default function MobileSidebarShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileHeader onMenuToggle={() => setOpen((v) => !v)} isMenuOpen={open} />
      <MobileSidebar isOpen={open} onClose={() => setOpen(false)} />
      {children}
    </>
  );
}
