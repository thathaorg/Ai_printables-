"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/** Celebration confetti for thank-you / unlock moments. */
export default function ConfettiBurst({ fire = true }: { fire?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !fire || prefersReducedMotion()) return;

    const colors = ["#FF7A45", "#0F9F6E", "#3FA9E0", "#FFB020", "#C49BFF", "#FF8FAB"];
    const bits: HTMLSpanElement[] = [];

    for (let i = 0; i < 36; i++) {
      const bit = document.createElement("span");
      const size = 6 + Math.random() * 8;
      Object.assign(bit.style, {
        position: "absolute",
        left: "50%",
        top: "40%",
        width: `${size}px`,
        height: `${size * (0.6 + Math.random())}px`,
        borderRadius: Math.random() > 0.5 ? "50%" : "3px",
        background: colors[i % colors.length],
        pointerEvents: "none",
      });
      root.appendChild(bit);
      bits.push(bit);

      const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
      const dist = 80 + Math.random() * 160;
      gsap.fromTo(
        bit,
        { x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 },
        {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist + 40,
          scale: 1,
          opacity: 0,
          rotate: Math.random() * 360,
          duration: 1.1 + Math.random() * 0.5,
          ease: "power2.out",
          delay: Math.random() * 0.15,
        }
      );
    }

    return () => {
      bits.forEach((b) => b.remove());
    };
  }, [fire]);

  return <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />;
}
