"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Soft wooden desk under a worksheet preview with light parallax.
 * Serves "this is a printable on a table" — not pure decoration.
 */
export default function DeskParallax({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const root = rootRef.current;
    const sheet = sheetRef.current;
    const shadow = shadowRef.current;
    if (!root || !sheet || prefersReducedMotion()) return;

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      gsap.to(sheet, {
        rotateX: -y * 6,
        rotateY: x * 8,
        y: y * -4,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
      if (shadow) {
        gsap.to(shadow, {
          x: x * 10,
          y: 8 + y * 6,
          opacity: 0.35 + Math.abs(x) * 0.08,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const onLeave = () => {
      gsap.to(sheet, { rotateX: 0, rotateY: 0, y: 0, duration: 0.7, ease: "power3.out" });
      if (shadow) gsap.to(shadow, { x: 0, y: 12, opacity: 0.28, duration: 0.7 });
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative mx-auto w-full max-w-md select-none [perspective:900px] ${className}`}
    >
      {/* desk surface */}
      <div
        className="absolute inset-x-[-8%] bottom-0 top-[18%] rounded-[1.5rem] opacity-90"
        style={{
          background:
            "linear-gradient(145deg, #e8c89a 0%, #d4a574 35%, #c4925e 70%, #b8844f 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 40px -20px rgba(80,40,10,0.35)",
        }}
        aria-hidden
      />
      {/* wood grain hint */}
      <div
        className="pointer-events-none absolute inset-x-[-8%] bottom-0 top-[18%] rounded-[1.5rem] opacity-25 mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(95deg, transparent, transparent 8px, rgba(90,50,20,0.08) 8px, rgba(90,50,20,0.08) 10px)",
        }}
        aria-hidden
      />
      {/* crayons on desk */}
      <div className="pointer-events-none absolute bottom-3 left-2 flex gap-1 opacity-90 sm:left-4" aria-hidden>
        {["#FF6B5A", "#FFD56A", "#5ECF8A", "#5BA8E8"].map((c, i) => (
          <span
            key={c}
            className="block h-8 w-2.5 rounded-full border border-black/10 shadow-sm"
            style={{ background: c, transform: `rotate(${-12 + i * 8}deg)` }}
          />
        ))}
      </div>

      {/* soft shadow under paper */}
      <div
        ref={shadowRef}
        className="absolute left-[8%] right-[8%] top-[22%] bottom-[10%] rounded-xl bg-black/30 blur-xl"
        style={{ opacity: ready ? 0.28 : 0.2, transform: "translateY(12px)" }}
        aria-hidden
      />

      {/* paper sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 mx-auto w-[88%] origin-center will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="overflow-hidden rounded-lg bg-white shadow-[0_8px_24px_-8px_rgba(40,20,0,0.35)] ring-1 ring-black/10">
          {children}
        </div>
      </div>
    </div>
  );
}
