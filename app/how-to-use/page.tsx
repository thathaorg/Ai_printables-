"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import { PRINTABLE_KINDS } from "@/lib/printable-catalog";
import {
  Sparkles,
  Eye,
  Mail,
  Download,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "Pick a template",
    text: "Letters, numbers, coloring, or counting — no AI prompt to write.",
    icon: Sparkles,
  },
  {
    n: "2",
    title: "Choose options",
    text: "Age, style, letter, topic. The bridge may already fill some for you.",
    icon: CheckCircle2,
  },
  {
    n: "3",
    title: "Preview first",
    text: "See the worksheet on screen before you enter an email.",
    icon: Eye,
  },
  {
    n: "4",
    title: "Unlock the PDF",
    text: "Email + one newsletter · download instantly · also sent to inbox.",
    icon: Download,
  },
];

export default function HowToUsePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="relative min-h-screen pb-28 text-[var(--ink)]">
      <MobileHeader
        onMenuToggle={() => setIsSidebarOpen((p) => !p)}
        isMenuOpen={isSidebarOpen}
      />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="mx-auto max-w-4xl px-4 pt-24 sm:px-6">
        <header className="mb-10 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[var(--kiwi)]">
            How Kiwiz works
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Generate first. Gate second.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[var(--ink)]/75">
            You always see the printable before sharing an email. That&apos;s the whole product.
          </p>
        </header>

        <ol className="mb-12 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.n}
                className="rounded-[1.5rem] bg-white p-5 shadow-[0_12px_32px_-18px_rgba(30,41,53,0.25)] ring-1 ring-black/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--kiwi)] font-display text-lg font-bold text-white">
                    {s.n}
                  </span>
                  <Icon className="h-5 w-5 text-[var(--kiwi)]" />
                </div>
                <h2 className="mt-3 font-display text-xl font-bold">{s.title}</h2>
                <p className="mt-1 text-sm text-[var(--ink)]/70">{s.text}</p>
              </li>
            );
          })}
        </ol>

        <section className="mb-12">
          <h2 className="mb-4 text-center font-display text-2xl font-bold">
            What kinds of printables?
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRINTABLE_KINDS.map((p) => (
              <Link
                key={p.id}
                href={`/create?preset=${p.id}`}
                className={`overflow-hidden rounded-2xl p-2 ${p.tint} ring-1 ring-black/5`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white">
                  <Image src={p.preview} alt={p.sample} fill className="object-cover object-top" sizes="160px" />
                </div>
                <p className={`mt-2 text-center font-display text-sm font-bold ${p.accent}`}>
                  {p.shortTitle}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-[1.75rem] bg-white p-6 ring-1 ring-black/5">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--coral)]" /> Why we ask for email
          </h2>
          <p className="mt-2 text-sm text-[var(--ink)]/75 leading-relaxed">
            After you preview, enter your email to unlock the free A4 PDF. You pick at least one
            free printable club so we can send new worksheets. We also email the PDF so you
            don&apos;t lose it.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]/80">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--kiwi)]" /> 3 free generations/day as guest, 6 when logged in</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--kiwi)]" /> Kid-safety check on every image</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--kiwi)]" /> Bridge pages never collect email</li>
          </ul>
        </section>

        <div className="mb-16 text-center">
          <Link
            href="/create"
            className="btn-chunky btn-primary-chunky inline-flex items-center gap-2 px-8 py-4 text-lg"
          >
            Start in the studio
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
