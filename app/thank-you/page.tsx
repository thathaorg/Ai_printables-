"use client";

// PRD: single conversion URL — confirmation, re-download, tag recommendations, newsletter joins.

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Download, Mail, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getRecommendations } from "@/lib/presets";
import { getFunnel, track } from "@/lib/funnel";
import { getPrintableKind, PRINTABLE_KINDS } from "@/lib/printable-catalog";
import ConfettiBurst from "@/components/motion/ConfettiBurst";
import { prefersReducedMotion, EASE_BOUNCE } from "@/lib/motion";

const NEWSLETTER_LISTS = [
  { id: "weekly_printable_club", title: "Weekly Printable Club" },
  { id: "alphabet_numbers", title: "Alphabet & Numbers Practice" },
  { id: "seasonal_holiday", title: "Seasonal & Holiday Printables" },
  { id: "teacher_pack", title: "Teacher Resource Pack" },
];

interface LastWorksheet {
  title: string;
  preset: string;
  options: Record<string, string>;
  filename: string;
  emailed: boolean;
  pdfBase64?: string;
}

function ThankYouContent() {
  const [last, setLast] = useState<LastWorksheet | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const [fire, setFire] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kiwiz_last_worksheet");
      if (raw) setLast(JSON.parse(raw));
    } catch {}
    track("thank_you_view", {});

    if (!prefersReducedMotion()) {
      gsap.from(".ty-enter", {
        y: 24,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: EASE_BOUNCE,
      });
    }

    const t = setTimeout(() => setFire(false), 1600);
    return () => clearTimeout(t);
  }, []);

  const redownload = () => {
    if (!last?.pdfBase64) return;
    const bytes = Uint8Array.from(atob(last.pdfBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = last.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("pdf_redownloaded", { preset: last.preset });
  };

  const joinList = async (listId: string) => {
    const email = localStorage.getItem("kiwiz_gate_email");
    if (!email) {
      toast.error("Make a worksheet first to join with one click!");
      return;
    }
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lists: [listId] }),
      });
      if (!res.ok) throw new Error();
      setJoined((prev) => [...prev, listId]);
      track("newsletter_subscribed", { lists: [listId], from: "thank_you" });
      toast.success("You're in!");
    } catch {
      toast.error("Couldn't subscribe. Please try again.");
    }
  };

  const recs = last
    ? getRecommendations(last.preset, last.options)
    : getRecommendations("coloring_page", {});
  const funnel = getFunnel();
  const kind = last ? getPrintableKind(last.preset) : null;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-28 pt-16 sm:px-6">
      <ConfettiBurst fire={fire} />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FFE5B4]/50 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-64 w-64 rounded-full bg-[#D4F5E2]/40 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-lg space-y-6 text-center">
        <div className="ty-enter relative mx-auto mt-2 w-fit">
          <div className="absolute inset-0 scale-125 rounded-full bg-[#FFD56A]/35 blur-xl" />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE08A] to-[#FFB347] shadow-[0_12px_0_0_rgba(30,41,53,0.1)] ring-4 ring-white">
            <Image src="/brand/mascot-kiwi-hero.png" alt="" width={100} height={100} className="h-[92px] w-[92px] rounded-full object-cover drop-shadow-md" />
          </div>
          <Image
            src="/brand/sticker-star.svg"
            alt=""
            width={36}
            height={36}
            className="absolute -right-2 -top-1"
          />
        </div>

        <div className="ty-enter">
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
            Excellent!
          </h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            {last?.emailed
              ? "Your printable downloaded — and a copy is on its way to your inbox."
              : "Your printable downloaded. Ready for crayons!"}
          </p>
          {last && (
            <p className="mt-1 font-display text-sm font-bold text-[#E07A3A]">{last.title}</p>
          )}
        </div>

        <div className="ty-enter flex flex-wrap items-center justify-center gap-3">
          {last?.pdfBase64 && (
            <Button onClick={redownload} variant="secondary" size="lg">
              <Download className="h-4 w-4" /> Download again
            </Button>
          )}
          <Link
            href="/create"
            className="btn-chunky btn-soft-chunky inline-flex items-center gap-2 px-5 py-3"
          >
            Make another <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="ty-enter rounded-[1.75rem] bg-white p-5 text-left shadow-[0_16px_40px_-20px_rgba(30,41,53,0.25)] ring-1 ring-black/5 sm:p-6">
          <h2 className="text-center font-display text-lg font-bold text-[var(--ink)]">
            Make another printable ✨
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {recs.slice(0, 3).map((rec, i) => {
              const meta =
                getPrintableKind(rec.presetId) ??
                PRINTABLE_KINDS.find((p) => p.id === rec.presetId);
              const params = new URLSearchParams({ preset: rec.presetId, ...rec.params });
              if (funnel.bridgeId) params.set("bridge", funnel.bridgeId);
              return (
                <Link
                  key={i}
                  href={`/create?${params.toString()}`}
                  onClick={() => track("recommendation_clicked", { to: rec.presetId })}
                  className={`block overflow-hidden rounded-2xl p-2.5 transition hover:-translate-y-0.5 ${
                    meta?.tint ?? "bg-[#F3F4F6]"
                  }`}
                >
                  {meta && (
                    <div className="mb-2 overflow-hidden rounded-xl bg-white/80 p-1">
                      <Image
                        src={meta.preview}
                        alt=""
                        width={120}
                        height={145}
                        className="mx-auto h-auto w-full max-w-[100px]"
                      />
                    </div>
                  )}
                  <p className={`text-center font-display text-xs font-bold ${meta?.accent ?? ""}`}>
                    {rec.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="ty-enter rounded-[1.75rem] bg-white p-5 text-left shadow-[0_16px_40px_-20px_rgba(30,41,53,0.25)] ring-1 ring-black/5 sm:p-6">
          <h2 className="flex items-center justify-center gap-2 font-display text-lg font-bold">
            <Mail className="h-5 w-5 text-[var(--kiwi)]" />
            More free printables
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {NEWSLETTER_LISTS.map((list) => (
              <Button
                key={list.id}
                variant="outline"
                disabled={joined.includes(list.id)}
                onClick={() => joinList(list.id)}
                className="h-auto whitespace-normal py-3 text-sm"
              >
                {joined.includes(list.id) ? "✓ Joined" : list.title}
              </Button>
            ))}
          </div>
        </section>

        <div className="ty-enter grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5">
            <p className="font-display text-sm font-bold text-[var(--ink)]">Share with a parent</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Send a free bridge link — no app install.
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-bold text-[var(--kiwi-deep)] underline"
              onClick={async () => {
                const url = `${window.location.origin}/free/dino_coloring_01?utm_source=share`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Link copied — paste in a message!");
                  track("share_link_copied", {});
                } catch {
                  toast.message(url);
                }
              }}
            >
              Copy free dino link
            </button>
          </div>
          <div className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5">
            <p className="font-display text-sm font-bold text-[var(--ink)]">Print tip</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">
              Print at <strong className="text-[var(--ink)]">100% scale / actual size</strong> on A4
              or letter paper. Portrait works best. Use thicker paper for crayons if you can.
            </p>
            <Link
              href="/how-to-use"
              className="mt-3 inline-block text-sm font-bold text-[var(--kiwi-deep)] underline"
            >
              How to use
            </Link>
          </div>
        </div>

        <div className="ty-enter rounded-2xl border-2 border-dashed border-[var(--sun)]/60 bg-[color-mix(in_oklab,var(--sun)_12%,white)] p-4 text-left">
          <p className="font-display text-sm font-bold text-[var(--ink)]">More packs later</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Seasonal bundles are free via our newsletter — join a list at the gate anytime. No paywall today.
          </p>
          <Link
            href="/parenting-newsletter"
            className="mt-2 inline-block text-sm font-bold text-[var(--kiwi-deep)] underline"
          >
            Parent tips list
          </Link>
        </div>

        {kind && (
          <p className="ty-enter text-xs text-[var(--ink-soft)]">
            You just made a <span className="font-semibold">{kind.title}</span> printable.
          </p>
        )}

        <Link
          href="/create"
          className="ty-enter inline-flex items-center gap-1 font-display text-sm font-bold text-[var(--kiwi-deep)]"
        >
          <Sparkles className="h-4 w-4" /> Back to studio
        </Link>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--kiwi)] border-t-transparent" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
