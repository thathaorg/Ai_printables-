"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";

/** Dynamic Three.js so create/thank-you routes stay light until needed. */
export const PlayroomScene = dynamic(
  () => import("./PlayroomScene"),
  { ssr: false }
) as ComponentType<{ className?: string }>;
