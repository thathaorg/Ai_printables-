"use client";

import { useEffect } from "react";
import { captureFunnelFromUrl, track } from "@/lib/funnel";

/** Captures funnel + bridge CTA / option clicks for PRD tracking. */
export default function BridgeTracker({ bridgeId }: { bridgeId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("bridge", bridgeId);
    captureFunnelFromUrl(params);
    track("bridge_view", { bridgeId });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("a,button") as HTMLElement | null;
      if (!el) return;
      const option = el.getAttribute("data-bridge-option");
      if (option) {
        track("bridge_option_selected", { bridgeId, option });
        track("bridge_cta_click", { bridgeId, option });
        return;
      }
      if (el.getAttribute("data-bridge-cta") === "true") {
        track("bridge_cta_click", { bridgeId });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [bridgeId]);
  return null;
}
