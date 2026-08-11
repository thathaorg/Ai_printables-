"use client"

import React from "react"
import BottomNav from "@/components/ui/BottomNav"

// PRD: email is only ever asked at the download gate on /create — no global
// newsletter popups (they would also appear on bridge pages, which must
// never collect email).
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
