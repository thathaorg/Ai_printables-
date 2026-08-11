"use client";

import { Suspense, useEffect, useState } from "react";
import gsap from "gsap";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import PresetStudio from "@/components/preset-studio";
import { prefersReducedMotion, EASE_PLAY } from "@/lib/motion";

function CreatePageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Never animate the whole studio with opacity — stuck GSAP leaves the page blank.
    if (prefersReducedMotion()) return;
    const els = gsap.utils.toArray<HTMLElement>(".create-enter");
    if (!els.length) return;
    const tween = gsap.fromTo(
      els,
      { y: 16, opacity: 0.15 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: EASE_PLAY,
        clearProps: "transform,opacity",
        onComplete: () => {
          els.forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
        },
      }
    );
    return () => {
      tween.kill();
      els.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-28 lg:pb-10">
      <MobileHeader
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6">
        <header className="mb-8 text-center">
          <p className="create-enter font-display text-sm font-bold uppercase tracking-[0.16em] text-[var(--kiwi)]">
            Worksheet studio
          </p>
          <h1 className="create-enter mt-2 font-display text-3xl font-bold text-[var(--ink)] sm:text-4xl">
            Pick a template. Print in a minute.
          </h1>
          <p className="create-enter mx-auto mt-2 max-w-lg text-base font-medium text-[var(--ink)]/75">
            No prompt writing — just a few taps. Preview first, unlock the PDF with email.
          </p>
        </header>
        {/* Studio is NOT opacity-animated so options never vanish */}
        <PresetStudio />
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--kiwi)] border-t-transparent" />
        </div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
