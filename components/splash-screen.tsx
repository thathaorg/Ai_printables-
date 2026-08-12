"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import BrandLogo from "@/components/brand-logo";
import { prefersReducedMotion, EASE_BOUNCE } from "@/lib/motion";

interface SplashScreenProps {
  onComplete: () => void;
}

/** First-visit splash — always exits within ~3.2s so mobile never gets stuck. */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onComplete();
    };

    // Hard failsafe — never trap users on splash (esp. if GSAP/Image hangs)
    const hard = window.setTimeout(finish, 3200);

    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      const t = window.setTimeout(finish, 500);
      return () => {
        clearTimeout(t);
        clearTimeout(hard);
      };
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });

      tl.from(".splash-logo", {
        scale: 0.4,
        rotation: -12,
        opacity: 0,
        duration: 0.55,
        ease: EASE_BOUNCE,
      })
        .from(
          ".splash-title",
          { y: 20, opacity: 0, duration: 0.35, ease: "power3.out" },
          "-=0.2"
        )
        .from(".splash-sub", { y: 12, opacity: 0, duration: 0.3 }, "-=0.15")
        .from(
          ".splash-chip",
          { scale: 0.6, opacity: 0, stagger: 0.06, duration: 0.3, ease: EASE_BOUNCE },
          "-=0.1"
        )
        .to(barRef.current, { scaleX: 1, duration: 0.85, ease: "power1.inOut" }, "-=0.2")
        .to(root, { autoAlpha: 0, duration: 0.25, delay: 0.05 });
    }, root);

    return () => {
      clearTimeout(hard);
      ctx.revert();
    };
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#eef8f4]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-16 h-48 w-48 rounded-full bg-[#B8E4FF]/50 blur-3xl" />
        <div className="absolute -right-8 bottom-20 h-56 w-56 rounded-full bg-[#FFE5B4]/55 blur-3xl" />
      </div>

      <Image
        src="/brand/sticker-star.svg"
        alt=""
        width={40}
        height={40}
        priority={false}
        className="splash-float absolute left-[12%] top-[22%]"
      />
      <Image
        src="/brand/sticker-crayon.svg"
        alt=""
        width={48}
        height={48}
        priority={false}
        className="splash-float absolute right-[14%] top-[30%]"
      />
      <Image
        src="/brand/sticker-paper.svg"
        alt=""
        width={44}
        height={44}
        priority={false}
        className="splash-float absolute bottom-[22%] left-[18%]"
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="splash-logo mb-4">
          <BrandLogo href={undefined} size={72} showWordmark={false} />
        </div>
        <h1 className="splash-title font-display text-5xl font-bold text-[var(--ink)] sm:text-6xl">
          KI<span className="text-[var(--kiwi)]">WIZ</span>
        </h1>
        <p className="splash-sub mt-2 max-w-xs text-[var(--ink-soft)]">
          Printables kids color, trace &amp; count — ready in a minute.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {["Letters", "Numbers", "Coloring", "Counting"].map((label) => (
            <span
              key={label}
              className="splash-chip rounded-full bg-white px-3 py-1 font-display text-xs font-bold text-[var(--ink)] shadow-sm ring-1 ring-black/5"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-black/5">
          <div
            ref={barRef}
            className="h-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[var(--kiwi)] via-[var(--sun)] to-[var(--coral)]"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (done.current) return;
            done.current = true;
            onComplete();
          }}
          className="mt-6 text-sm font-semibold text-[var(--kiwi-deep)] underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
