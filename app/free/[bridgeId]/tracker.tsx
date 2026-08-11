"use client";

import { useEffect } from "react";
import { captureFunnelFromUrl, track } from "@/lib/funnel";

export default function BridgeTracker({ bridgeId }: { bridgeId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("bridge", bridgeId);
    captureFunnelFromUrl(params);
    track("bridge_view", { bridgeId });
  }, [bridgeId]);
  return null;
}
