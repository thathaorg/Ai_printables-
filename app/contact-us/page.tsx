"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";

const FAQ = [
  {
    q: "Why didn’t my worksheet generate?",
    a: "Check your connection and try again. Daily free limits reset at midnight UTC. Popular options (like Letter A) often load instantly from our library.",
  },
  {
    q: "Why can’t I download the PDF?",
    a: "After you see the preview, enter your email and join at least one free newsletter list. Then the print-ready A4 PDF unlocks and can be emailed to you.",
  },
  {
    q: "Do I need an account?",
    a: "No. Kiwiz works without login. We only use a cookie for fair daily free generations.",
  },
  {
    q: "How long until you reply?",
    a: "We usually reply within 1–24 hours depending on the channel.",
  },
  {
    q: "How do I report a weird or unsafe page?",
    a: "Email us a screenshot and which options you picked — we’ll review and fix templates quickly.",
  },
];

export default function ContactUsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const emailAddress =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "software@thatha.org";
  const whatsappUrl = whatsappNumber
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}`
    : null;
  const emailUrl = `mailto:${emailAddress}?subject=${encodeURIComponent("Kiwiz support")}`;

  return (
    <main className="min-h-screen pb-28">
      <MobileHeader
        onMenuToggle={() => setIsSidebarOpen((p) => !p)}
        isMenuOpen={isSidebarOpen}
      />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="mx-auto max-w-2xl px-4 pt-24">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sun)]/30">
            <HelpCircle className="h-7 w-7 text-[var(--ink)]" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Contact us</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-soft)]">
            Questions about free printables, downloads, or classroom use? We&apos;re happy to help.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={emailUrl}
            className="flex items-center gap-3 rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--kiwi)]/15">
              <Mail className="h-5 w-5 text-[var(--kiwi-deep)]" />
            </div>
            <div className="text-left">
              <p className="font-display text-sm font-bold">Email</p>
              <p className="text-xs text-[var(--ink-soft)]">{emailAddress}</p>
            </div>
          </a>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/15">
                <MessageCircle className="h-5 w-5 text-[#128C7E]" />
              </div>
              <div className="text-left">
                <p className="font-display text-sm font-bold">WhatsApp</p>
                <p className="text-xs text-[var(--ink-soft)]">Message us</p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-[1.35rem] bg-white/70 p-4 ring-1 ring-black/5">
              <MessageCircle className="h-5 w-5 text-[var(--ink-soft)]" />
              <p className="text-left text-xs text-[var(--ink-soft)]">
                WhatsApp support coming soon — email works anytime.
              </p>
            </div>
          )}
        </div>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-lg font-bold text-[var(--ink)]">Common questions</h2>
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 open:ring-[var(--kiwi)]/40"
            >
              <summary className="cursor-pointer list-none font-display text-sm font-bold text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                {item.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.a}</p>
            </details>
          ))}
        </section>

        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/create">Back to create</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
