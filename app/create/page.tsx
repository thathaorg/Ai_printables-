"use client";

import { Suspense, useState } from "react";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import PresetStudio from "@/components/preset-studio";

function CreatePageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fffbea 0%, #ffe4b5 40%, #ffd580 70%, #ffcf6b 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.8) 1px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />

      <MobileHeader onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isMenuOpen={isSidebarOpen} />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative z-10 container mx-auto px-4 py-6 pt-24 max-w-4xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-orange-700 mb-2">
          Make a printable worksheet ✨
        </h1>
        <p className="text-center text-gray-700 mb-8">
          Pick a template, choose a few options, and get a print-ready PDF.
        </p>
        <PresetStudio />
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CreatePageContent />
    </Suspense>
  );
}
