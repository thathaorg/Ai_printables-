"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, EASE_PLAY, EASE_BOUNCE } from "@/lib/motion";

let registered = false;
function ensureGsap() {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

/** Soft scroll-in for sections — guides parents down without blocking CTAs. */
export function useScrollReveal<T extends HTMLElement>(
  deps: unknown[] = [],
  opts?: { y?: number; stagger?: number; start?: string }
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    ensureGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const kids = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const targets = kids.length ? Array.from(kids) : [root];

    const ctx = gsap.context(() => {
      // Ensure visible if ScrollTrigger never fires (short pages / mobile chrome)
      gsap.set(targets, { autoAlpha: 1, y: 0, scale: 1 });
      gsap.fromTo(
        targets,
        { autoAlpha: 0.01, y: opts?.y ?? 28, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: EASE_PLAY,
          stagger: opts?.stagger ?? 0.08,
          clearProps: "transform,opacity,visibility",
          scrollTrigger: {
            trigger: root,
            start: opts?.start ?? "top 92%",
            once: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/** Multi-layer mouse parallax on children with data-depth */
export function useMouseParallax<T extends HTMLElement>(strength = 18) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    ensureGsap();

    const layers = root.querySelectorAll<HTMLElement>("[data-depth]");
    if (!layers.length) return;

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      layers.forEach((el) => {
        const d = parseFloat(el.dataset.depth || "1");
        gsap.to(el, {
          x: x * strength * d,
          y: y * strength * d,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    const onLeave = () => {
      layers.forEach((el) => {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: EASE_PLAY });
      });
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return ref;
}

/** Springy press micro-interaction for interactive cards */
export function usePressable<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const down = () => gsap.to(el, { scale: 0.96, duration: 0.12, ease: "power2.out" });
    const up = () => gsap.to(el, { scale: 1, duration: 0.35, ease: EASE_BOUNCE });
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", up);
    };
  }, []);

  return ref;
}

/** Pop a new preview into place after AI generation succeeds. */
export function popIn(el: HTMLElement | null) {
  if (!el) return;
  if (prefersReducedMotion()) {
    el.style.opacity = "1";
    return;
  }
  gsap.fromTo(
    el,
    { autoAlpha: 0.2, y: 24, scale: 0.96, rotate: -1 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      duration: 0.6,
      ease: EASE_BOUNCE,
      clearProps: "transform,opacity,visibility",
    }
  );
}

/** Soft hop when selecting a preset type. */
export function selectPulse(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { scale: 0.94 },
    { scale: 1, duration: 0.4, ease: EASE_BOUNCE }
  );
}
