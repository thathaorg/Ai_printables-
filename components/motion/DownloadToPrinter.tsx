"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Lightweight Lottie-like sequence: PDF arrow drops into a printer after gate.
 * No external Lottie file dependency — pure GSAP SVG scene.
 */
export default function DownloadToPrinter({
  play = true,
  onDone,
}: {
  play?: boolean;
  onDone?: () => void;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || !play) return;

    if (prefersReducedMotion()) {
      onDone?.();
      return;
    }

    const page = svg.querySelector("#dtp-page");
    const arrow = svg.querySelector("#dtp-arrow");
    const tray = svg.querySelector("#dtp-tray");
    const glow = svg.querySelector("#dtp-glow");
    const check = svg.querySelector("#dtp-check");

    const tl = gsap.timeline({
      onComplete: () => onDone?.(),
    });

    gsap.set([page, arrow, check], { transformOrigin: "50% 50%" });
    gsap.set(check, { autoAlpha: 0, scale: 0 });
    gsap.set(glow, { autoAlpha: 0 });

    tl.fromTo(arrow, { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35 })
      .to(arrow, { y: 22, duration: 0.45, ease: "power2.in" })
      .to(arrow, { autoAlpha: 0, duration: 0.15 }, "-=0.1")
      .fromTo(
        page,
        { y: -30, autoAlpha: 0, scaleY: 0.6 },
        { y: 8, autoAlpha: 1, scaleY: 1, duration: 0.4, ease: "back.out(1.4)" }
      )
      .to(tray, { y: 3, duration: 0.15, yoyo: true, repeat: 1 })
      .to(glow, { autoAlpha: 0.7, duration: 0.25 })
      .to(check, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, "-=0.1")
      .to(glow, { autoAlpha: 0.25, duration: 0.4 });

    return () => {
      tl.kill();
    };
  }, [play, onDone]);

  return (
    <div className="mx-auto flex flex-col items-center gap-2 py-2" aria-hidden={!play}>
      <svg
        ref={ref}
        viewBox="0 0 160 140"
        className="h-28 w-36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* glow */}
        <ellipse id="dtp-glow" cx="80" cy="108" rx="42" ry="10" fill="#0F9F6E" opacity="0.35" />

        {/* printer body */}
        <rect x="34" y="58" width="92" height="42" rx="10" fill="#E8F4EE" stroke="#0F9F6E" strokeWidth="3" />
        <rect x="44" y="48" width="72" height="18" rx="5" fill="#0F9F6E" />
        <rect x="52" y="68" width="56" height="8" rx="2" fill="#B8DCC9" />
        <circle cx="112" cy="76" r="3.5" fill="#FF5A4E" />
        <rect id="dtp-tray" x="48" y="94" width="64" height="8" rx="2" fill="#C8DFD4" stroke="#0F9F6E" strokeWidth="2" />

        {/* arrow download */}
        <g id="dtp-arrow">
          <path d="M80 18v28" stroke="#FF7A45" strokeWidth="4" strokeLinecap="round" />
          <path d="M66 36l14 14 14-14" stroke="#FF7A45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* paper out */}
        <g id="dtp-page">
          <rect x="58" y="78" width="44" height="36" rx="3" fill="#FFFDF8" stroke="#1E2935" strokeWidth="2" />
          <path d="M66 88h28M66 96h22M66 104h24" stroke="#A8B8B0" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* check badge */}
        <g id="dtp-check">
          <circle cx="120" cy="48" r="14" fill="#0F9F6E" />
          <path d="M113 48l5 5 9-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <p className="font-display text-sm font-bold text-[var(--kiwi-deep)]">
        PDF ready · sending to inbox
      </p>
    </div>
  );
}
