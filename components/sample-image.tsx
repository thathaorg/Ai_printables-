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
}: {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [current, setCurrent] = useState(src);

  return (
    <div className={cn("relative overflow-hidden bg-white", className)}>
      <Image
        src={current}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-top"
        sizes="(max-width: 640px) 50vw, 280px"
        onError={() => {
          if (fallback && current !== fallback) setCurrent(fallback);
        }}
      />
    </div>
  );
}
