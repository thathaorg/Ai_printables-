import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { BridgeConfig } from "@/lib/bridges";
import { getBridgeById } from "@/lib/bridge-store";
import BridgeTracker from "./tracker";

// Bridge pages are fast, minimal doors (PRD): no email field, no data
// storage, no generation. They pre-fill /create via URL params and pass
// bridge id + UTM through. Configs come from lib/bridges.ts plus any pages
// created in the admin CMS (/admin/cms).

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bridgeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bridgeId } = await params;
  const bridge = await getBridgeById(bridgeId);
  if (!bridge) return {};
  return { title: `${bridge.headline} | Kiwiz`, description: bridge.subline };
}

function createUrl(
  bridge: BridgeConfig,
  utm: Record<string, string>,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams({
    ...bridge.payload,
    ...(extra ?? {}),
    bridge: bridge.bridgeId,
    ...utm,
  });
  return `/create?${params.toString()}`;
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

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center"
      style={{
        background: "linear-gradient(135deg, #fffbea 0%, #ffe4b5 40%, #ffd580 70%, #ffcf6b 100%)",
      }}
    >
      <BridgeTracker bridgeId={bridge.bridgeId} />
      <div className="text-6xl mb-4">{bridge.emoji}</div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-orange-700 max-w-2xl leading-tight">
        {bridge.headline}
      </h1>
      <p className="mt-4 text-lg text-gray-700 max-w-xl">{bridge.subline}</p>

      {bridge.template === "offer" ? (
        <Link
          href={createUrl(bridge, utm)}
          className="mt-8 inline-block rounded-full bg-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-orange-600 hover:scale-105 transition-all"
        >
          {bridge.cta} →
        </Link>
      ) : (
        <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-2xl">
          {pickerValues.map((value) => (
            <Link
              key={value}
              href={createUrl(bridge, utm, bridge.payloadKey ? { [bridge.payloadKey]: value } : undefined)}
              className={`rounded-full bg-white border-2 border-orange-400 font-bold text-orange-700 shadow-sm hover:bg-orange-500 hover:text-white hover:scale-110 transition-all ${
                value.length <= 2 ? "w-12 h-12 flex items-center justify-center text-lg" : "px-6 py-3"
              }`}
            >
              {value}
            </Link>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-gray-500">
        100% free · print-ready A4 PDF · made for ages 2–5
      </p>
    </main>
  );
}
