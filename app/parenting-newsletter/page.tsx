"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LOCAL_STORAGE_SUBSCRIBED_KEY } from "@/components/NewsletterPrompt";

export default function ParentingNewsletterPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lists: ["weekly_printable_club", "alphabet_numbers"],
        }),
      });
      if (!res.ok) throw new Error("fail");
      localStorage.setItem(LOCAL_STORAGE_SUBSCRIBED_KEY, "true");
      setDone(true);
      toast.success("You're on the list — free ideas coming soon.");
      setEmail("");
    } catch {
      toast.error("Couldn’t subscribe. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen pb-28">
      <MobileHeader onMenuToggle={() => setOpen((v) => !v)} isMenuOpen={open} />
      <MobileSidebar isOpen={open} onClose={() => setOpen(false)} />

      <div className="mx-auto max-w-lg px-4 pt-24 text-center">
        <div className="rounded-[1.75rem] bg-white p-8 shadow-[0_16px_40px_-20px_rgba(30,41,53,0.28)] ring-1 ring-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sun)]/35">
            <Mail className="h-7 w-7 text-[var(--ink)]" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-[var(--ink)]">
            Parent tips &amp; free printables
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
            Short emails with gentle learning ideas for ages 2–5 — plus new free
            worksheet ideas when they drop.
          </p>

          {done ? (
            <div className="mt-6 rounded-2xl bg-[var(--kiwi)]/10 p-4">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--kiwi)]" />
              <p className="mt-2 font-display font-bold text-[var(--kiwi-deep)]">You&apos;re in!</p>
              <Button asChild className="mt-4" variant="secondary">
                <Link href="/create">
                  <Sparkles className="h-4 w-4" /> Make a worksheet now
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={subscribe} className="mt-6 space-y-3">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-full border-2 px-4"
              />
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Joining…" : "Join free list"}
              </Button>
              <p className="text-[11px] text-[var(--ink-soft)]">
                Unsubscribe anytime. See{" "}
                <Link href="/privacy" className="underline">
                  Privacy
                </Link>
                .
              </p>
            </form>
          )}
        </div>

        <ul className="mt-6 space-y-3 text-left">
          {[
            "Ideas for 5-minute tracing games at home",
            "Printable themes by season and interest",
            "How to use presets — no AI prompts needed",
          ].map((t) => (
            <li
              key={t}
              className="flex gap-3 rounded-2xl bg-white/90 p-4 text-sm text-[var(--ink-soft)] ring-1 ring-black/5"
            >
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--coral)]" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
