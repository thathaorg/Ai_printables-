"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import BrandLogo from "@/components/brand-logo";
import { PRINTABLE_KINDS } from "@/lib/printable-catalog";
import { ShieldCheck, Heart, Printer, ArrowRight } from "lucide-react";

export default function AboutUsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="relative min-h-screen pb-28 text-[var(--ink)]">
      <MobileHeader
        onMenuToggle={() => setIsSidebarOpen((p) => !p)}
        isMenuOpen={isSidebarOpen}
      />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <div className="mb-8 flex justify-center">
          <BrandLogo size={56} />
        </div>

        <header className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Printables that parents actually finish
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[var(--ink)]/75 leading-relaxed">
            Kiwiz is a preset worksheet maker for toddlers — not an open AI prompt box.
            Pick a template, tap a few options, print an A4 PDF in about a minute.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {[
            { icon: Heart, title: "Parents & teachers", text: "Fast offline fun after print" },
            { icon: ShieldCheck, title: "Kid-safe by design", text: "Safety filter on every image" },
            { icon: Printer, title: "Home-printer ready", text: "Thick outlines, low ink B&W" },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl bg-white p-5 text-center ring-1 ring-black/5">
              <v.icon className="mx-auto h-6 w-6 text-[var(--kiwi)]" />
              <h2 className="mt-2 font-display font-bold">{v.title}</h2>
              <p className="mt-1 text-xs text-[var(--ink)]/65">{v.text}</p>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl font-bold text-center">What we make</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRINTABLE_KINDS.map((p) => (
              <div key={p.id} className={`rounded-2xl overflow-hidden p-2 ${p.tint}`}>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white">
                  <Image src={p.preview} alt={p.title} fill className="object-cover object-top" sizes="120px" />
                </div>
                <p className={`mt-2 text-center text-xs font-display font-bold ${p.accent}`}>{p.shortTitle}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-[1.75rem] bg-gradient-to-br from-[var(--kiwi)] to-[var(--kiwi-deep)] p-8 text-center text-white mb-16">
          <Image
            src="/brand/mascot-kiwi-hero.png"
            alt=""
            width={80}
            height={80}
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover ring-4 ring-white/30"
          />
          <h2 className="font-display text-2xl font-bold">Ready when the crayons are</h2>
          <Link
            href="/create"
            className="btn-chunky mt-6 inline-flex items-center gap-2 bg-[var(--sun)] px-6 py-3 font-display font-bold text-[var(--ink)]"
          >
            Make a free worksheet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
