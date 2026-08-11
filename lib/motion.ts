"use client";

/** Shared motion prefs — animations must not block the print/email job. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const EASE_PLAY = "power3.out";
export const EASE_BOUNCE = "back.out(1.4)";
