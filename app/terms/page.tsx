import Link from "next/link";
import type { Metadata } from "next";
import BrandLogo from "@/components/brand-logo";
import MobileSidebarShell from "@/components/mobile-sidebar-shell";

export const metadata: Metadata = {
  title: "Terms of Use | Kiwiz",
  description: "Terms of use for Kiwiz free printable worksheets.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pb-28">
      <MobileSidebarShell>
        <div className="mx-auto max-w-2xl px-4 pt-24">
          <div className="mb-6 flex justify-center sm:justify-start">
            <BrandLogo size={36} />
          </div>
          <article className="rounded-[1.75rem] bg-white p-6 shadow-[0_16px_40px_-20px_rgba(30,41,53,0.25)] ring-1 ring-black/5 sm:p-10">
            <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Terms of Use</h1>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">Last updated: August 2026</p>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-soft)] [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[var(--ink)] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
              <p>
                Kiwiz (“we”, “our”) provides free, AI-assisted printable worksheets for
                parents and teachers. By using this site you agree to these terms.
              </p>
              <h2>Service</h2>
              <p>
                You may generate a limited number of worksheets per day (shown in the
                product). Download may require an email and joining at least one free
                newsletter list.
              </p>
              <h2>Acceptable use</h2>
              <ul>
                <li>Use for personal, family, or classroom learning.</li>
                <li>Do not try to generate unsafe or adult content.</li>
                <li>Do not scrape, abuse, or overload the service.</li>
              </ul>
              <h2>Content</h2>
              <p>
                Worksheets are AI-generated and may vary. Safety checks may substitute a
                fallback page. Print for your household or class; commercial resale of
                Kiwiz-branded packs needs permission.
              </p>
              <h2>Email</h2>
              <p>
                At the download gate you consent to receive the PDF and the free lists you
                select. Unsubscribe links appear in marketing emails.
              </p>
              <h2>Disclaimer</h2>
              <p>
                Service is provided “as is.” Adult supervision is recommended for young
                children online.
              </p>
              <p>
                See also our{" "}
                <Link href="/privacy" className="font-semibold text-[var(--kiwi-deep)] underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </MobileSidebarShell>
    </main>
  );
}
