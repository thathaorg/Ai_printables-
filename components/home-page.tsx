"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import MobileHeader from "@/components/mobile-header";
import MobileSidebar from "@/components/mobile-sidebar";
import { PRINTABLE_KINDS } from "@/lib/printable-catalog";
import { PlayroomScene } from "@/components/motion/PlayroomLazy";
import { useMouseParallax, useScrollReveal, selectPulse } from "@/components/motion/hooks";
import { prefersReducedMotion, EASE_BOUNCE } from "@/lib/motion";
import SampleImage from "@/components/sample-image";
import {
  Sparkles,
  ShieldCheck,
  Printer,
  Mail,
  ArrowRight,
  Check,
} from "lucide-react";

const STEPS = [
  { n: "01", title: "Choose a printable", text: "Letters, numbers, coloring, or counting — see a real sample of each." },
  { n: "02", title: "Tap a few options", text: "Age, style, letter, theme. No prompt writing." },
  { n: "03", title: "Print the PDF", text: "Preview first, then unlock A4 by email — also lands in inbox." },
];

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePreview, setActivePreview] = useState(PRINTABLE_KINDS[2].id);
  const active = PRINTABLE_KINDS.find((p) => p.id === activePreview) ?? PRINTABLE_KINDS[0];

  const heroRef = useMouseParallax<HTMLElement>(22);
  const printablesRef = useScrollReveal<HTMLElement>([], { stagger: 0.1 });
  const stepsRef = useScrollReveal<HTMLElement>([]);
  const doorsRef = useScrollReveal<HTMLElement>([], { stagger: 0.08 });
  const previewImgRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Hero entrance — safe fromTo + clearProps (avoids blank UI on Strict Mode remount)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const enter = gsap.utils.toArray<HTMLElement>(".hero-enter");
    const card = gsap.utils.toArray<HTMLElement>(".hero-card");
    const restore = () => {
      [...enter, ...card].forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    };
    const ctx = gsap.context(() => {
      gsap.fromTo(
        enter,
        { y: 20, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "transform,opacity",
          onComplete: restore,
        }
      );
      gsap.fromTo(
        card,
        { x: 28, opacity: 0.2, rotate: 1.5 },
        {
          x: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.7,
          ease: EASE_BOUNCE,
          delay: 0.08,
          clearProps: "transform,opacity",
          onComplete: restore,
        }
      );
    });
    return () => {
      ctx.revert();
      restore();
    };
  }, []);

  // When switching printable type, animate sample worksheet (product demo)
  useEffect(() => {
    const el = previewImgRef.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0.3, y: 16, scale: 0.96, rotate: -2 },
      { autoAlpha: 1, y: 0, scale: 1, rotate: 0, duration: 0.45, ease: EASE_BOUNCE }
    );
  }, [activePreview]);

  // Subtle CTA pulse so the primary action is findable
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || prefersReducedMotion()) return;
    const tw = gsap.to(el, {
      y: -3,
      duration: 1.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tw.kill();
    };
  }, []);

  const pickPreview = (id: string, btn: HTMLElement | null) => {
    setActivePreview(id);
    selectPulse(btn);
  };

  return (
    <main className="relative min-h-screen pb-28 text-[var(--ink)] lg:pb-0">
      <PlayroomScene className="fixed inset-0 z-0 opacity-50" />

      <MobileHeader
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        isMenuOpen={isSidebarOpen}
      />
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative z-10 overflow-hidden px-4 pb-10 pt-24 sm:px-6 md:px-10 lg:px-14 lg:pb-16 lg:pt-28"
      >
        <div
          data-depth="0.35"
          className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#B8E4FF]/45 blur-3xl"
        />
        <div
          data-depth="0.5"
          className="pointer-events-none absolute -right-16 top-40 h-72 w-72 rounded-full bg-[#FFE5B4]/50 blur-3xl"
        />
        <div
          data-depth="0.25"
          className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#D4F5E2]/50 blur-3xl"
        />

        <Image
          src="/brand/sticker-star.svg"
          alt=""
          data-depth="1.2"
          width={48}
          height={48}
          className="pointer-events-none absolute right-[14%] top-28 hidden sm:block"
        />
        <Image
          src="/brand/sticker-crayon.svg"
          alt=""
          data-depth="0.9"
          width={56}
          height={56}
          className="pointer-events-none absolute bottom-24 left-[8%] hidden md:block"
        />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div className="space-y-6 text-center lg:text-left">
            <div className="hero-enter inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-[0_8px_30px_-12px_rgba(30,41,53,0.2)] ring-1 ring-black/5">
              <Image src="/brand/mascot-kiwi-hero.png" alt="" width={32} height={32} className="rounded-full object-cover" />
              <span className="font-display text-sm font-bold text-[#E07A3A]">
                Good day, little makers!
              </span>
            </div>

            <div className="hero-enter">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--kiwi)]">
                KIWIZ · AI PRINTABLES
              </p>
              <h1 className="mt-2 font-display text-[2.35rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Printables kids can
                <span className="block text-[#FF7A45]">color, trace &amp; count</span>
              </h1>
            </div>

            <p className="hero-enter mx-auto max-w-md text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg lg:mx-0">
              Real worksheets for toddlers — alphabet practice, number tracing,
              cute coloring pages, and counting sheets. Pick a type, print A4 PDF.
            </p>

            <div className="hero-enter flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                ref={ctaRef}
                href="/create"
                className="btn-chunky btn-primary-chunky inline-flex items-center gap-2 px-7 py-3.5 text-base will-change-transform"
              >
                Make a free worksheet
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#printables"
                className="btn-chunky btn-soft-chunky inline-flex items-center gap-2 px-6 py-3.5 text-base"
              >
                See what we print
              </Link>
            </div>

            <ul className="hero-enter flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[var(--ink-soft)] lg:justify-start">
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[var(--kiwi)]" /> Kid-safe AI
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-[#5BA8E8]" /> Home printer A4
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-[#FF7A45]" /> PDF to inbox
              </li>
            </ul>
          </div>

          <div className="hero-card relative mx-auto w-full max-w-[420px]">
            <div
              data-depth="0.4"
              className="pointer-events-none absolute -right-10 -top-8 hidden w-36 opacity-90 sm:block"
            >
              <Image
                src="/brand/printables-float.png"
                alt=""
                width={160}
                height={160}
                className="h-auto w-full drop-shadow-xl"
              />
            </div>
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#FFD9A8]/40 via-[#C8F0FF]/30 to-[#D6F5E4]/40 blur-2xl" />
            <div className="relative rounded-[2rem] bg-white/95 p-4 shadow-[0_20px_50px_-20px_rgba(30,41,53,0.28)] ring-1 ring-black/5 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-display text-sm font-bold text-[var(--ink)]">
                  Sample printable
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${active.chip}`}>
                  {active.ages}
                </span>
              </div>

              <div
                className={`${active.tint} relative overflow-hidden rounded-[1.5rem] p-3 transition-colors duration-300`}
              >
                <div ref={previewImgRef} className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                  <SampleImage
                    src={active.preview}
                    fallback={active.fallbackPreview}
                    alt={active.sample}
                    hideHeader
                    className="absolute inset-0"
                    priority
                  />
                </div>
              </div>

              <div className="mt-4">
                <h2 className={`font-display text-xl font-bold ${active.accent}`}>
                  {active.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{active.detail}</p>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {PRINTABLE_KINDS.map((p) => {
                  const on = p.id === activePreview;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={(e) => pickPreview(p.id, e.currentTarget)}
                      className={`rounded-2xl px-1 py-2.5 text-center transition-all will-change-transform ${
                        on
                          ? "bg-[var(--ink)] text-white shadow-md scale-[1.02]"
                          : `${p.tint} text-[var(--ink)] hover:scale-[1.02]`
                      }`}
                    >
                      <span className="block font-display text-[11px] font-bold leading-tight sm:text-xs">
                        {p.shortTitle}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Link
                href={`/create?preset=${active.id}`}
                className="btn-chunky btn-primary-chunky mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-base"
              >
                Make this type
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <Image
              data-depth="1.4"
              src="/brand/mascot-kiwi-hero.png"
              alt=""
              width={108}
              height={108}
              className="absolute -bottom-5 -left-3 h-[88px] w-[88px] rounded-full object-cover drop-shadow-lg ring-4 ring-white sm:-left-6 sm:h-[100px] sm:w-[100px]"
            />
          </div>
        </div>
      </section>

      {/* PRINTABLES CATALOG */}
      <section
        id="printables"
        ref={printablesRef}
        className="relative z-10 scroll-mt-24 px-4 py-14 sm:px-6 md:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end" data-reveal>
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[var(--kiwi)]">
                What you get
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
                Four kinds of printables
              </h2>
              <p className="mt-2 max-w-lg text-[var(--ink-soft)]">
                Real sample art on every card — peek at what kids will color, trace, and count.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-1 font-display text-sm font-bold text-[var(--kiwi-deep)]"
            >
              Open studio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRINTABLE_KINDS.map((p) => (
              <Link
                key={p.id}
                data-reveal
                href={`/create?preset=${p.id}`}
                className={`group relative overflow-hidden rounded-[1.75rem] p-4 shadow-[0_12px_40px_-18px_rgba(30,41,53,0.25)] ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(30,41,53,0.3)] ${p.tint}`}
                onMouseEnter={(e) => {
                  if (prefersReducedMotion()) return;
                  gsap.to(e.currentTarget, { y: -6, duration: 0.25, ease: "power2.out" });
                }}
                onMouseLeave={(e) => {
                  if (prefersReducedMotion()) return;
                  gsap.to(e.currentTarget, { y: 0, duration: 0.35, ease: EASE_BOUNCE });
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.chip}`}>
                    {p.ages}
                  </span>
                  <span className="font-display text-xs font-bold text-[var(--ink)]/40">A4 PDF</span>
                </div>

                <div className="relative mx-auto mb-3 aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_-14px_rgba(30,41,53,0.35)] ring-1 ring-black/8">
                  <div className="absolute inset-[6px] overflow-hidden rounded-xl bg-[#FFFEFA]">
                    <SampleImage
                      src={p.preview}
                      fallback={p.fallbackPreview}
                      alt={`${p.title} sample worksheet`}
                      hideHeader
                      className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  {/* tiny paper corner fold cue */}
                  <div className="pointer-events-none absolute right-2 top-2 h-5 w-5 rounded-bl-md bg-gradient-to-bl from-black/5 to-transparent" />
                </div>

                <h3 className={`font-display text-xl font-bold ${p.accent}`}>{p.title}</h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{p.blurb}</p>
                <ul className="mt-3 space-y-1">
                  <li className="flex items-start gap-1.5 text-xs text-[var(--ink)]/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--kiwi)]" />
                    {p.sample}
                  </li>
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 font-display text-sm font-bold text-[var(--ink)]">
                  Create this
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={stepsRef} className="relative z-10 px-4 py-12 sm:px-6 md:px-10 lg:px-14">
        <div
          data-reveal
          className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white/95 shadow-[0_20px_50px_-24px_rgba(30,41,53,0.28)] ring-1 ring-black/5 backdrop-blur-sm"
        >
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#FF8A4C] to-[#FFB347] px-8 py-10 text-white sm:px-10">
              <Image
                src="/brand/mascot-kiwi-hero.png"
                alt=""
                width={140}
                height={140}
                className="pointer-events-none absolute -bottom-2 -right-2 h-28 w-28 rounded-full object-cover opacity-95 ring-4 ring-white/40 sm:h-32 sm:w-32"
              />
              <h2 className="relative z-10 font-display text-3xl font-bold sm:text-4xl">
                See it first,
                <br />
                then unlock PDF
              </h2>
              <p className="relative z-10 mt-3 max-w-xs text-sm leading-relaxed text-white/90">
                Generate → preview → email → pick a free newsletter → download.
                Same flow every time.
              </p>
            </div>
            <ol className="grid gap-6 px-8 py-10 sm:grid-cols-3 sm:px-10">
              {STEPS.map((s) => (
                <li key={s.n} data-reveal>
                  <span className="font-display text-3xl font-bold text-[#FF8A4C]/30">{s.n}</span>
                  <h3 className="mt-1 font-display text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FREE DOORS */}
      <section ref={doorsRef} className="relative z-10 px-4 py-14 sm:px-6 md:px-10 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <h2 data-reveal className="text-center font-display text-3xl font-bold sm:text-4xl">
            Jump in free
          </h2>
          <p data-reveal className="mx-auto mt-2 max-w-md text-center text-[var(--ink-soft)]">
            One tap doors — options pre-filled so you&apos;re almost done already.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRINTABLE_KINDS.map((p) => (
              <Link
                key={p.id}
                data-reveal
                href={p.freeBridge ?? `/create?preset=${p.id}`}
                className="flex items-center gap-3 rounded-[1.5rem] bg-white/95 p-3 shadow-[0_10px_30px_-16px_rgba(30,41,53,0.22)] ring-1 ring-black/5 transition hover:-translate-y-0.5"
              >
                <div className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-xl ${p.tint}`}>
                  <SampleImage
                    src={p.preview}
                    fallback={p.fallbackPreview}
                    alt=""
                    className="absolute inset-0"
                  />
                </div>
                <div className="min-w-0 text-left">
                  <p className={`font-display text-sm font-bold ${p.accent}`}>{p.shortTitle}</p>
                  <p className="truncate text-xs text-[var(--ink-soft)]">{p.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 pb-20 pt-4 sm:px-6 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] bg-white/95 px-8 py-12 text-center shadow-[0_20px_50px_-24px_rgba(30,41,53,0.25)] ring-1 ring-black/5 backdrop-blur-sm">
          <Image src="/brand/sticker-star.svg" alt="" width={48} height={48} className="mb-3" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready when the crayons are</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--ink-soft)]">
            3 free pages/day as guest · 6 when logged in · every image goes through a safety check.
          </p>
          <Link
            href="/create"
            className="btn-chunky btn-primary-chunky mt-8 inline-flex items-center gap-2 px-8 py-4 text-lg"
          >
            <Sparkles className="h-5 w-5" />
            Open the studio
          </Link>
        </div>
      </section>
    </main>
  );
}
