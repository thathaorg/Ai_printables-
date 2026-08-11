import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t-2 border-[color-mix(in_oklab,var(--ink)_8%,transparent)] bg-[var(--paper)] px-6 py-14 text-[var(--ink)] md:px-12 lg:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3 text-center md:text-left">
          <BrandLogo size={40} />
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            Print-ready worksheets for toddlers — presets, not prompts. Coloring,
            tracing, and counting pages parents can make in under a minute.
          </p>
          <p className="text-xs text-[var(--ink-soft)]">
            © {new Date().getFullYear()} Kiwiz · AI Printables
          </p>
        </div>

        <div className="grid flex-1 gap-8 text-center text-sm md:grid-cols-3 md:text-left">
          <div className="space-y-3">
            <h5 className="font-display text-base font-bold text-[var(--ink)]">Create</h5>
            <ul className="space-y-2 text-[var(--ink-soft)]">
              <li>
                <Link href="/create" className="transition hover:text-[var(--kiwi)]">
                  Worksheet studio
                </Link>
              </li>
              <li>
                <Link href="/free/dino_coloring_01" className="transition hover:text-[var(--kiwi)]">
                  Free dino coloring
                </Link>
              </li>
              <li>
                <Link href="/free/alphabet_tracing_01" className="transition hover:text-[var(--kiwi)]">
                  Free letter tracing
                </Link>
              </li>
              <li>
                <Link href="/free/teacher_pack_01" className="transition hover:text-[var(--kiwi)]">
                  Teacher pack
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-display text-base font-bold text-[var(--ink)]">Learn</h5>
            <ul className="space-y-2 text-[var(--ink-soft)]">
              <li>
                <Link href="/how-to-use" className="transition hover:text-[var(--kiwi)]">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="transition hover:text-[var(--kiwi)]">
                  About Kiwiz
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-[var(--kiwi)]">
                  Free daily limits
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-display text-base font-bold text-[var(--ink)]">Support</h5>
            <ul className="space-y-2 text-[var(--ink-soft)]">
              <li>
                <Link href="/contact-us" className="transition hover:text-[var(--kiwi)]">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/parenting-newsletter" className="transition hover:text-[var(--kiwi)]">
                  Parent tips
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-[var(--kiwi)]">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-[var(--kiwi)]">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
