import Link from "next/link";
import type { Metadata } from "next";
import BrandLogo from "@/components/brand-logo";
import MobileSidebarShell from "@/components/mobile-sidebar-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Kiwiz",
  description: "How Kiwiz collects and uses data for free printable worksheets.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pb-28">
      <MobileSidebarShell>
        <div className="mx-auto max-w-2xl px-4 pt-24">
          <div className="mb-6 flex justify-center sm:justify-start">
            <BrandLogo size={36} />
          </div>
          <article className="rounded-[1.75rem] bg-white p-6 shadow-[0_16px_40px_-20px_rgba(30,41,53,0.25)] ring-1 ring-black/5 sm:p-10">
            <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Privacy Policy</h1>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">Last updated: August 2026</p>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-soft)] [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[var(--ink)] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
              <p>
                Kiwiz respects families&apos; privacy. This policy explains what we
                collect when you use our free printable product.
              </p>
              <h2>What we collect</h2>
              <ul>
                <li>
                  <strong className="text-[var(--ink)]">Email</strong> — when you unlock a
                  PDF at the download gate.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Newsletter choices</strong> — lists you
                  join to unlock the download.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Anonymous usage cookie</strong> (
                  <code className="text-xs">kiwiz_anon_id</code>) — daily free generation
                  limits.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Funnel tags</strong> — optional UTM,
                  bridge page ID, and worksheet options for product improvement and
                  campaigns.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Technical logs</strong> — standard
                  hosting analytics needed to run the site.
                </li>
              </ul>
              <h2>What we do not require</h2>
              <p>
                You do not need a password or social login to use Kiwiz. We do not
                intentionally collect payment card data on the free product.
              </p>
              <h2>How we use data</h2>
              <ul>
                <li>Deliver the PDF you requested (and re-send if needed).</li>
                <li>Send the free newsletters you opted into.</li>
                <li>Prevent spam and enforce fair daily limits.</li>
                <li>Understand which free offers and worksheets help families most.</li>
              </ul>
              <h2>Sharing</h2>
              <p>
                We use infrastructure and email providers (hosting, database, email
                delivery, optional ESP) only to operate the product. We do not sell
                children&apos;s personal data. Marketing emails go only to the address
                you provide and the lists you join.
              </p>
              <h2>Children</h2>
              <p>
                The product is designed for parents and teachers. Young children should
                use worksheets offline with adult supervision. We do not knowingly
                collect data from children under 13 without a parent/guardian.
              </p>
              <h2>Retention &amp; rights</h2>
              <p>
                Generation and lead records are kept as long as needed for delivery,
                abuse prevention, and analytics. You may request access or deletion of
                your email records via Contact. Unsubscribe links appear in marketing
                emails.
              </p>
              <h2>Cookies</h2>
              <p>
                Essential cookies store your anonymous daily limit and admin session
                (staff only). Analytics may use privacy-friendly tools from our host.
              </p>
              <h2>Contact</h2>
              <p>
                Questions? Visit{" "}
                <Link href="/contact-us" className="font-semibold text-[var(--kiwi-deep)] underline">
                  Contact us
                </Link>
                . Also see our{" "}
                <Link href="/terms" className="font-semibold text-[var(--kiwi-deep)] underline">
                  Terms of Use
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
