"use client";

// Client-side funnel context: bridge id + UTM params travel with every event
// and never break between the bridge page, /create, the gate and /thank-you.

export interface FunnelContext {
  bridgeId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const KEY = "kiwiz_funnel";

export function captureFunnelFromUrl(params: URLSearchParams): FunnelContext {
  const fresh: FunnelContext = {
    bridgeId: params.get("bridge") ?? undefined,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
  const existing = getFunnel();
  const merged: FunnelContext = {
    bridgeId: fresh.bridgeId ?? existing.bridgeId,
    utmSource: fresh.utmSource ?? existing.utmSource,
    utmMedium: fresh.utmMedium ?? existing.utmMedium,
    utmCampaign: fresh.utmCampaign ?? existing.utmCampaign,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}

export function getFunnel(): FunnelContext {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Fire-and-forget funnel event; the server persists it with funnel context. */
export function track(name: string, props: Record<string, unknown> = {}): void {
  try {
    const body = JSON.stringify({ event: name, props, ...getFunnel() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}
