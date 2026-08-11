"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/** Scribble / crayon ring while AI draws a worksheet. */
export default function GenerateAura({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active || prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 0 });
      return;
    }

    gsap.set(el, { autoAlpha: 1 });
    const rings = el.querySelectorAll(".aura-ring");
    const tl = gsap.timeline({ repeat: -1 });
    rings.forEach((ring, i) => {
      tl.fromTo(
        ring,
        { scale: 0.6, opacity: 0.6 },
        { scale: 1.6, opacity: 0, duration: 1.4, ease: "power1.out" },
        i * 0.35
      );
    });

    const pencil = el.querySelector(".aura-pencil");
    if (pencil) {
      gsap.to(pencil, {
        rotate: 12,
        y: -6,
        duration: 0.45,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    return () => {
      tl.kill();
      gsap.killTweensOf(pencil);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      aria-live="polite"
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span className="aura-ring absolute inset-0 rounded-full border-4 border-[var(--coral)]/40" />
        <span className="aura-ring absolute inset-0 rounded-full border-4 border-[var(--kiwi)]/40" />
        <span className="aura-ring absolute inset-0 rounded-full border-4 border-[var(--sun)]/40" />
        <span className="aura-pencil text-5xl" aria-hidden>
          ✏️
        </span>
      </div>
    </div>
  );
}
