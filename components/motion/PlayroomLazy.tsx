"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentType } from "react";

const Scene = dynamic(() => import("./PlayroomScene"), {
  ssr: false,
  loading: () => null,
}) as ComponentType<{ className?: string }>;

/**
 * Desktop-only atmosphere. Phones/tablets skip WebGL — Three.js + large textures
 * commonly crash mobile Safari/Chrome ("This page couldn't load").
 */
export function PlayroomScene({ className = "" }: { className?: string }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const narrow = window.matchMedia("(max-width: 900px)").matches;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData;
      const lowMem =
        typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number" &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory as number) > 0 &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory as number) < 4;
      if (narrow || coarse || saveData || lowMem) return;

      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext("experimental-webgl");
      if (!gl) return;
      setOk(true);
    } catch {
      /* skip 3D */
    }
  }, []);

  if (!ok) return null;
  return <Scene className={className} />;
}
