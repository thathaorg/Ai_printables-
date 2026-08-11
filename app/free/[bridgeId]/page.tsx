import { getBridgeById } from "@/lib/bridge-store";
import BridgeTracker from "./tracker";
import BrandLogo from "@/components/brand-logo";
import BridgeInteractive from "@/components/bridge-interactive";
import { getPrintableKind } from "@/lib/printable-catalog";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bridgeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-printables.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bridgeId } = await params;
  const bridge = await getBridgeById(bridgeId);
  if (!bridge) return {};
  const kind = getPrintableKind(bridge.payload.preset ?? "");
  const ogImage = kind?.preview?.startsWith("http")
    ? kind.preview
    : `${siteUrl}${kind?.preview ?? "/brand/printables-float.png"}`;
  return {
    title: `${bridge.headline} | Kiwiz`,
    description: bridge.subline,
    openGraph: {
      title: bridge.headline,
      description: bridge.subline,
      url: `${siteUrl}/free/${bridge.bridgeId}`,
      images: [{ url: ogImage, alt: bridge.headline }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: bridge.headline,
      description: bridge.subline,
      images: [ogImage],
    },
  };
}

export default async function BridgePage({ params, searchParams }: Props) {
  const { bridgeId } = await params;
  const sp = await searchParams;
  const bridge = await getBridgeById(bridgeId);
  if (!bridge) notFound();

  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const v = sp[key];
    if (typeof v === "string") utm[key] = v;
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const numbers = "0123456789".split("");
  const pickerValues =
    bridge.template === "letter_picker"
      ? letters
      : bridge.template === "number_picker"
        ? numbers
        : (bridge.options ?? []);

  const kind = getPrintableKind(bridge.payload.preset ?? "");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-14 text-center">
      <BridgeTracker bridgeId={bridge.bridgeId} />

      <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#B8E4FF]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-20 h-64 w-64 rounded-full bg-[#FFE5B4]/50 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl animate-pop-in">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={42} />
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_50px_-24px_rgba(30,41,53,0.35)] ring-1 ring-black/5">
          {kind && (
            <div
              className={`${kind.tint} flex items-center gap-4 border-b border-black/5 px-6 py-4 text-left sm:px-8`}
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <Image
                  src={kind.preview}
                  alt={kind.sample}
                  fill
                  className="object-cover object-top"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${kind.chip}`}>
                  You&apos;ll get · {kind.shortTitle}
                </span>
                <p className={`mt-1 font-display text-sm font-bold ${kind.accent}`}>
                  {kind.sample}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ink-soft)]">{kind.detail}</p>
              </div>
            </div>
          )}

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1E0] text-4xl">
              {bridge.emoji}
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight text-[var(--ink)] sm:text-4xl">
              {bridge.headline}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-[var(--ink-soft)]">
              {bridge.subline}
            </p>

            <BridgeInteractive bridge={bridge} utm={utm} pickerValues={pickerValues} />

            <p className="mt-8 text-sm text-[var(--ink-soft)]">
              100% free · print-ready A4 PDF · ages 2–5
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--ink-soft)]">
          No email here — generate the page inside Kiwiz first.{" "}
          <Link href="/" className="underline">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
