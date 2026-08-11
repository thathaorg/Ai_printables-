"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Printer,
  BookOpen,
  Mail,
  Gift,
  Zap,
} from "lucide-react";
import { CREDITS } from "@/lib/kiwiz-config";

/** Helpful hub — no accounts. Credits + quick starts. */
export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(CREDITS.anonymousPerDay);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.remaining === "number") setRemaining(d.remaining);
        if (typeof d.limit === "number") setLimit(d.limit);
      })
      .catch(() => setRemaining(null));
  }, []);

  return (
    <main className="min-h-screen pb-28">
      <MobileHeader
        onMenuToggle={() => setIsSidebarOpen((p) => !p)}
        isMenuOpen={isSidebarOpen}
      />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-24">
        <div className="rounded-[1.75rem] bg-white p-7 text-center shadow-[0_16px_40px_-20px_rgba(30,41,53,0.28)] ring-1 ring-black/5">
          <Sparkles className="mx-auto h-10 w-10 text-[var(--kiwi)]" />
          <h1 className="mt-3 font-display text-2xl font-bold text-[var(--ink)]">
            Your free day
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
            No account needed. Cookies keep your daily free worksheets fair for everyone.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--kiwi)]/12 px-4 py-2 font-display text-sm font-bold text-[var(--kiwi-deep)]">
            <Zap className="h-4 w-4" />
            {remaining === null
              ? `Up to ${limit} free worksheets / day`
              : `${remaining} of ${limit} free worksheets left today`}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Library matches (same options) are free and don&apos;t use a credit.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/create">
              Make a worksheet <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Quick
            href="/how-to-use"
            icon={BookOpen}
            title="How it works"
            body="Presets → preview → email for PDF"
          />
          <Quick
            href="/free/alphabet_tracing_01"
            icon={Printer}
            title="Free letter sheet"
            body="Pick A–Z on a bridge page"
          />
          <Quick
            href="/free/teacher_pack_01"
            icon={Gift}
            title="Teacher pack"
            body="Classroom worksheet picker"
          />
          <Quick
            href="/parenting-newsletter"
            icon={Mail}
            title="Parent tips"
            body="Weekly free printable ideas"
          />
        </div>
      </div>
    </main>
  );
}

function Quick({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5"
    >
      <Icon className="h-5 w-5 text-[var(--coral)]" />
      <p className="mt-2 font-display text-sm font-bold text-[var(--ink)]">{title}</p>
      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{body}</p>
    </Link>
  );
}
