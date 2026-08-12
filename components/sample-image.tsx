"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Robust sample thumbnail — real AI PNG with SVG fallback. */
export default function SampleImage({
  src,
  fallback,
  alt,
  className,
  priority,
  /** Skip worksheet Name/Date band so the fun art fills the card */
  hideHeader = true,
}: {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  hideHeader?: boolean;
}) {
  const [current, setCurrent] = useState(src);

  return (
    <div className={cn("relative overflow-hidden bg-[#FFFEFA]", className)}>
      {/* Soft paper edge */}
      <div className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] ring-1 ring-inset ring-black/5" />
      <Image
        src={current}
        alt={alt}
        fill
        priority={priority}
        className={cn(
          "transition duration-500 ease-out",
          hideHeader
            ? // Push past Name/Date (~12–16% of page) and zoom so content fills frame
              "object-cover object-[center_22%] scale-[1.28] origin-top"
            : "object-cover object-top"
        )}
        sizes="(max-width: 640px) 55vw, 280px"
        onError={() => {
          if (fallback && current !== fallback) setCurrent(fallback);
        }}
      />
      {/* Fade top edge so any leftover header feels intentional */}
      {hideHeader && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-8 bg-gradient-to-b from-[#FFFEFA] to-transparent" />
      )}
    </div>
  );
}
