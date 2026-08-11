"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Lock,
  Download,
  Mail,
  Sparkles,
  CheckCircle2,
  Gift,
  Zap,
  AlertTriangle,
  Printer,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { captureFunnelFromUrl, getFunnel, track } from "@/lib/funnel";
import { getPrintableKind } from "@/lib/printable-catalog";
import SampleImage from "@/components/sample-image";
import GenerateAura from "@/components/motion/GenerateAura";
import ConfettiBurst from "@/components/motion/ConfettiBurst";
import DeskParallax from "@/components/motion/DeskParallax";
import DownloadToPrinter from "@/components/motion/DownloadToPrinter";
import { popIn, selectPulse } from "@/components/motion/hooks";
import { CREDITS } from "@/lib/kiwiz-config";

interface PublicPresetOption {
  key: string;
  label: string;
  values: string[];
  allowCustom?: boolean;
  default?: string;
}
interface PublicPreset {
  id: string;
  title: string;
  emoji: string;
  description: string;
  options: PublicPresetOption[];
  tags: string[];
}

const NEWSLETTER_LISTS = [
  { id: "weekly_printable_club", title: "Weekly Printable Club", description: "New free worksheets every week" },
  { id: "alphabet_numbers", title: "Alphabet & Numbers Practice", description: "Letter and number worksheets by age" },
  { id: "seasonal_holiday", title: "Seasonal & Holiday Printables", description: "Christmas, Halloween and more" },
  { id: "teacher_pack", title: "Teacher Resource Pack", description: "Classroom-ready printable packs" },
];

const GATE_EMAIL_KEY = "kiwiz_gate_email";

type GateStep = "closed" | "email" | "lists" | "delivering";

interface GenerationResult {
  generationId: string | null;
  imageUrl: string;
  preset: string;
  options: Record<string, string>;
  remaining: number;
  limit: number;
  fallback: boolean;
  cached?: boolean;
}

function downloadPdf(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PresetStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [presets, setPresets] = useState<PublicPreset[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [presetId, setPresetId] = useState<string>("coloring_page");
  const [values, setValues] = useState<Record<string, string>>({});
  const [customText, setCustomText] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [gateStep, setGateStep] = useState<GateStep>("closed");
  const [email, setEmail] = useState("");
  const [pickedLists, setPickedLists] = useState<string[]>(["weekly_printable_club"]);
  const [celebrate, setCelebrate] = useState(false);
  const initialised = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPrintAnim, setShowPrintAnim] = useState(false);
  const [credits, setCredits] = useState<{ remaining: number; limit: number } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [printTip, setPrintTip] = useState(false);

  const refreshCredits = useCallback(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.remaining === "number" && typeof d.limit === "number") {
          setCredits({ remaining: d.remaining, limit: d.limit });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const preset = useMemo(
    () => presets.find((p) => p.id === presetId) ?? presets[0],
    [presets, presetId]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/presets")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.presets)) setPresets(data.presets);
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialised.current || presets.length === 0) return;
    initialised.current = true;

    captureFunnelFromUrl(searchParams as unknown as URLSearchParams);

    const urlPreset = searchParams.get("preset");
    const chosen =
      urlPreset && presets.some((p) => p.id === urlPreset) ? urlPreset : presets[0].id;
    setPresetId(chosen);

    const p = presets.find((pr) => pr.id === chosen)!;
    const prefill: Record<string, string> = {};
    for (const opt of p.options) {
      const v = searchParams.get(opt.key);
      if (v) prefill[opt.key] = v;
    }
    setValues(prefill);

    const savedEmail = localStorage.getItem(GATE_EMAIL_KEY);
    if (savedEmail) setEmail(savedEmail);

    track("preset_form_view", { preset: chosen, prefilled: Object.keys(prefill) });
  }, [presets, searchParams]);

  const optionValue = useCallback(
    (key: string) => values[key] ?? preset?.options.find((o) => o.key === key)?.default ?? "",
    [values, preset]
  );

  const setOption = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    track("option_changed", { preset: preset.id, key, value });
  };

  const worksheetTitle = useMemo(() => {
    if (!preset) return "Kiwiz Worksheet";
    const parts: string[] = [preset.title];
    if (preset.id === "alphabet_tracing") parts.push(`Letter ${optionValue("letter")}`);
    if (preset.id === "number_tracing") parts.push(`Number ${optionValue("number")}`);
    if (preset.id === "coloring_page") parts.push(optionValue("topic"));
    if (preset.id === "counting_worksheet") parts.push(optionValue("subject"));
    return parts.join(" – ");
  }, [preset, optionValue]);

  const handleGenerate = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setGenError("You’re offline. Reconnect and try again.");
      toast.error("No internet connection.");
      return;
    }
    setIsGenerating(true);
    setLimitMessage(null);
    setGenError(null);
    setPrintTip(false);
    track("generate_clicked", { preset: preset.id, options: values });
    track("generation_started", { preset: preset.id });

    try {
      const funnel = getFunnel();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: preset.id, options: values, bridge: funnel.bridgeId }),
      });
      const data = await response.json();

      if (response.status === 403) {
        setLimitMessage(data.message ?? "Daily limit reached.");
        setCredits({ remaining: 0, limit: data.limit ?? CREDITS.anonymousPerDay });
        track("generation_limit_reached", { preset: preset.id, loggedIn: data.loggedIn });
        track("credits_used", { remaining: 0, limit: data.limit });
        return;
      }
      if (response.status === 422) {
        toast.error(data.message ?? "That topic isn't suitable for kids.");
        track("generation_safety_blocked", { preset: preset.id });
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.error ?? "generation failed");

      setResult(data);
      setCredits({ remaining: data.remaining, limit: data.limit });
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1400);
      track("generation_succeeded", {
        preset: preset.id,
        fallback: data.fallback,
        cached: !!data.cached,
      });
      track("credits_used", { remaining: data.remaining, limit: data.limit, cached: !!data.cached });
      track("preview_shown", { preset: preset.id });
      if (data.cached) {
        toast.success("Instant! Same worksheet from our library — no wait.");
      }
      if (data.fallback) {
        setGenError(null);
      }
      setTimeout(() => {
        popIn(previewRef.current);
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    } catch (err) {
      console.error(err);
      setGenError("We couldn’t create that worksheet. Try again in a moment.");
      toast.error("Couldn't create your worksheet. Please try again.");
      track("generation_failed", { preset: preset.id });
    } finally {
      setIsGenerating(false);
    }
  };

  const openGate = () => {
    track("email_gate_shown", { preset: preset.id });
    const savedEmail = localStorage.getItem(GATE_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      void deliver(savedEmail, true);
    } else {
      setGateStep("email");
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const funnel = getFunnel();
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          preset: preset.id,
          topic:
            optionValue("topic") ||
            optionValue("subject") ||
            optionValue("letter") ||
            optionValue("number"),
          age: optionValue("age"),
          style: optionValue("style"),
          bridge: funnel.bridgeId,
          utmSource: funnel.utmSource,
          utmMedium: funnel.utmMedium,
          utmCampaign: funnel.utmCampaign,
        }),
      });
      if (!res.ok) throw new Error("lead failed");
      track("email_submitted", { preset: preset.id });
      track("recommendation_shown", {});
      setGateStep("lists");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const toggleList = (id: string) => {
    setPickedLists((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const subscribeAndUnlock = async () => {
    if (pickedLists.length === 0) {
      toast.error("Pick at least one newsletter to unlock your download.");
      return;
    }
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lists: pickedLists }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "subscribe failed");
      track("newsletter_subscribed", { lists: pickedLists });
      localStorage.setItem(GATE_EMAIL_KEY, email);
      await deliver(email, false);
    } catch (err: any) {
      toast.error(err?.message ?? "Subscription failed. Please try again.");
    }
  };

  const deliver = async (deliverEmail: string, skippedGate: boolean) => {
    if (!result) return;
    setGateStep("delivering");
    try {
      const res = await fetch("/api/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: deliverEmail,
          imageUrl: result.imageUrl,
          title: worksheetTitle,
          generationId: result.generationId,
        }),
      });
      const data = await res.json();

      if (res.status === 403) {
        localStorage.removeItem(GATE_EMAIL_KEY);
        setGateStep(skippedGate ? "email" : "lists");
        if (!skippedGate) toast.error(data.message ?? "Join a newsletter to unlock.");
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error ?? "delivery failed");

      downloadPdf(data.pdfBase64, data.filename);
      track("pdf_downloaded", { preset: preset.id, emailed: data.emailed });
      if (data.emailed) track("email_sent", { preset: preset.id });
      setPrintTip(true);

      try {
        sessionStorage.setItem(
          "kiwiz_last_worksheet",
          JSON.stringify({
            title: worksheetTitle,
            preset: preset.id,
            options: result.options,
            filename: data.filename,
            emailed: data.emailed,
            pdfBase64: data.pdfBase64,
          })
        );
      } catch {
        try {
          sessionStorage.setItem(
            "kiwiz_last_worksheet",
            JSON.stringify({
              title: worksheetTitle,
              preset: preset.id,
              options: result.options,
              filename: data.filename,
              emailed: data.emailed,
            })
          );
        } catch {}
      }

      // Celebrate unlock: arrow → printer scene, then thank-you
      setShowPrintAnim(true);
      setGateStep("delivering");
      // Dialog stays open briefly with printer animation; navigate after
      await new Promise((r) => setTimeout(r, 2100));
      setGateStep("closed");
      setShowPrintAnim(false);
      router.push("/thank-you");
    } catch (err) {
      console.error(err);
      setGateStep("closed");
      setShowPrintAnim(false);
      toast.error("Couldn't deliver your PDF. Please try again.");
    }
  };

  if (catalogError) {
    return (
      <div className="paper-panel p-8 text-center">
        <p className="font-display text-lg font-bold text-[var(--ink)]">
          Couldn&apos;t load worksheet templates.
        </p>
        <Button onClick={() => location.reload()} className="mt-4" variant="secondary">
          Try again
        </Button>
      </div>
    );
  }

  if (!preset) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--kiwi)]" />
        <p className="mt-3 text-sm text-[var(--ink-soft)]">Loading templates…</p>
      </div>
    );
  }

  const kind = getPrintableKind(preset.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Always-visible free credits */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-display font-bold text-[var(--ink)] shadow-sm ring-1 ring-black/5">
          <Zap className="h-4 w-4 text-[var(--sun)]" />
          {credits
            ? `${credits.remaining} of ${credits.limit} free left today`
            : `Up to ${CREDITS.anonymousPerDay} free / day`}
        </div>
        <p className="text-[11px] text-[var(--ink-soft)]">
          Same options again = free library (no credit)
        </p>
      </div>

      {/* Visual catalog — show what each printable looks like */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((p) => {
          const active = p.id === preset.id;
          const meta = getPrintableKind(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                setPresetId(p.id);
                setResult(null);
                selectPulse(e.currentTarget);
                track("preset_selected", { preset: p.id });
              }}
              className={`group relative overflow-hidden rounded-[1.35rem] p-2.5 text-left shadow-[0_10px_28px_-16px_rgba(30,41,53,0.3)] ring-1 transition-all will-change-transform active:scale-[0.97] ${
                meta?.tint ?? "bg-white"
              } ${
                active
                  ? "ring-2 ring-[var(--ink)] -translate-y-1 scale-[1.02]"
                  : "ring-black/5 hover:-translate-y-0.5 opacity-95 hover:opacity-100"
              }`}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <SampleImage
                  src={meta?.preview ?? "/samples/dino-coloring.png"}
                  fallback={meta?.fallbackPreview}
                  alt={meta?.sample ?? p.title}
                  className="absolute inset-0 transition duration-200 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-2 px-0.5">
                <div className={`font-display text-[13px] font-bold leading-tight ${meta?.accent ?? "text-[var(--ink)]"}`}>
                  {meta?.shortTitle ?? p.title}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[10px] text-[var(--ink-soft)] sm:text-[11px]">
                  {meta?.blurb ?? p.description}
                </div>
              </div>
              {active && (
                <span className="absolute right-2 top-2 rounded-full bg-[var(--ink)] px-2 py-0.5 font-display text-[10px] font-bold text-white">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* options */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_16px_40px_-20px_rgba(30,41,53,0.28)] ring-1 ring-black/5">
        <GenerateAura active={isGenerating} />
        {celebrate && <ConfettiBurst fire />}
        {kind && (
          <div className={`${kind.tint} flex items-center gap-4 border-b border-black/5 px-5 py-4 sm:px-7`}>
            <div className="hidden h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 sm:block relative">
              <SampleImage
                src={kind.preview}
                fallback={kind.fallbackPreview}
                alt=""
                className="absolute inset-0"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${kind.chip}`}>
                {kind.ages} · A4 PDF
              </span>
              <h2 className={`mt-1 font-display text-xl font-bold sm:text-2xl ${kind.accent}`}>
                {kind.title}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{kind.detail}</p>
            </div>
          </div>
        )}

        <div className="space-y-6 p-5 sm:p-7">
        {!kind && (
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              {preset.emoji} {preset.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{preset.description}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {preset.options.map((opt) => {
            const current = optionValue(opt.key);
            const isCustom = opt.allowCustom && !!customText[opt.key];
            return (
              <div key={opt.key} className="space-y-2">
                <label className="font-display text-sm font-bold text-[var(--ink)]">
                  {opt.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v) => {
                    const on = current === v && !isCustom;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setCustomText((prev) => ({ ...prev, [opt.key]: "" }));
                          setOption(opt.key, v);
                        }}
                        className={`chip ${on ? "chip-active" : "hover:border-[var(--kiwi)]"}`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
                {opt.allowCustom && (
                  <Input
                    value={customText[opt.key] ?? ""}
                    onChange={(e) => {
                      setCustomText((prev) => ({ ...prev, [opt.key]: e.target.value }));
                      setOption(opt.key, e.target.value);
                    }}
                    placeholder="…or type your own topic"
                    className="mt-1 h-11 rounded-full border-2 border-[var(--border)] bg-[var(--paper)] px-4"
                    maxLength={60}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="xl"
          className="w-full"
          variant="default"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Drawing your worksheet…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> Generate my worksheet
            </>
          )}
        </Button>

        {isGenerating && (
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-[var(--kiwi)]/40 bg-[var(--kiwi)]/5 p-4">
            <div className="mx-auto aspect-[3/4] max-w-[200px] animate-pulse rounded-xl bg-white/80 ring-1 ring-black/5" />
            <p className="mt-3 text-center text-sm text-[var(--ink-soft)]">
              Sketching clean lines for print… usually under 20 seconds.
            </p>
          </div>
        )}

        {genError && (
          <div className="flex items-start gap-3 rounded-2xl border-2 border-[var(--coral)]/40 bg-[color-mix(in_oklab,var(--coral)_10%,white)] p-4 text-sm text-[var(--ink)]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--coral)]" />
            <div className="flex-1">
              <p className="font-display font-bold">Something went wrong</p>
              <p className="mt-1 text-[var(--ink-soft)]">{genError}</p>
              <Button onClick={handleGenerate} size="sm" className="mt-3" variant="secondary">
                Try again
              </Button>
            </div>
          </div>
        )}

        {limitMessage && (
          <div className="rounded-2xl border-2 border-[var(--sun)] bg-[color-mix(in_oklab,var(--sun)_18%,white)] p-4 text-center text-sm text-[var(--ink)]">
            {limitMessage} Come back tomorrow for more free worksheets.{" "}
            <Link href="/dashboard" className="font-bold underline">
              See my free day
            </Link>
          </div>
        )}
        </div>
      </section>

      {/* preview on soft desk with parallax */}
      {result && (
        <section
          ref={previewRef}
          className="relative space-y-5 rounded-[1.75rem] bg-white p-5 text-center shadow-[0_16px_40px_-20px_rgba(30,41,53,0.28)] ring-1 ring-black/5 sm:p-7"
        >
          {celebrate && <ConfettiBurst fire />}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--kiwi)]/12 px-4 py-1.5 font-display text-sm font-bold text-[var(--kiwi-deep)]">
              <CheckCircle2 className="h-4 w-4" />{" "}
              {result.cached ? "Ready instantly!" : "Your worksheet is ready!"}
            </div>
            {result.cached && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sun)]/25 px-3 py-1.5 font-display text-xs font-bold text-[var(--ink)]">
                <Library className="h-3.5 w-3.5" /> From saved library
              </div>
            )}
          </div>
          <h3 className="font-display text-2xl font-bold text-[var(--ink)]">{worksheetTitle}</h3>

          <DeskParallax>
            <div className="relative">
              <img
                src={result.imageUrl}
                alt={worksheetTitle}
                className="w-full pointer-events-none"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/2 w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] text-center font-display text-2xl font-black tracking-widest text-[var(--kiwi)]/15 sm:text-3xl">
                  KIWIZ PREVIEW
                </div>
              </div>
            </div>
          </DeskParallax>

          {result.fallback && (
            <div className="rounded-2xl bg-[var(--muted)] p-3 text-xs text-[var(--ink-soft)]">
              We served a ready-made page this time — hit generate to try a fresh AI drawing.
            </div>
          )}

          <Button onClick={openGate} size="xl" variant="sky" className="w-full sm:w-auto sm:min-w-[280px]">
            <Lock className="h-5 w-5" /> Enter email to download PDF
          </Button>
          <p className="text-xs text-[var(--ink-soft)]">
            {result.remaining} of {result.limit} free worksheets left today
            {result.cached ? " · this one was free (library)" : ""}
          </p>

          {printTip && (
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--kiwi)]/10 p-4 text-left text-sm text-[var(--ink)]">
              <Printer className="mt-0.5 h-5 w-5 shrink-0 text-[var(--kiwi-deep)]" />
              <div>
                <p className="font-display font-bold">Print tip</p>
                <p className="mt-1 text-[var(--ink-soft)]">
                  Print at <strong className="text-[var(--ink)]">100% / actual size</strong>, portrait,
                  on A4 or letter. Avoid “fit to page” so tracing lines stay the right size.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* email gate modal */}
      <Dialog
        open={gateStep !== "closed"}
        onOpenChange={(open) => !open && gateStep !== "delivering" && setGateStep("closed")}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-[1.75rem] border-2 border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-[var(--paper)] p-0 shadow-[0_16px_50px_-12px_rgb(15_159_110/0.35)] sm:max-w-md">
          <div className="bg-gradient-to-br from-[var(--kiwi)]/15 via-[var(--sun)]/10 to-transparent px-6 pt-6 pb-2">
            {gateStep === "email" && (
              <DialogHeader className="text-left space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--coral)] text-white shadow-[0_3px_0_0_color-mix(in_oklab,var(--ink)_14%,transparent)]">
                  <Mail className="h-6 w-6" />
                </div>
                <DialogTitle className="font-display text-2xl font-bold text-[var(--ink)]">
                  Almost yours!
                </DialogTitle>
                <DialogDescription className="text-[var(--ink-soft)] text-sm leading-relaxed">
                  Enter your email to download <strong className="text-[var(--ink)]">{worksheetTitle}</strong>{" "}
                  as a print-ready PDF. We&apos;ll also send a copy to your inbox.
                </DialogDescription>
              </DialogHeader>
            )}
            {gateStep === "lists" && (
              <DialogHeader className="text-left space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sun)] text-[var(--ink)] shadow-[0_3px_0_0_color-mix(in_oklab,var(--ink)_14%,transparent)]">
                  <Gift className="h-6 w-6" />
                </div>
                <DialogTitle className="font-display text-2xl font-bold text-[var(--ink)]">
                  One last fun step
                </DialogTitle>
                <DialogDescription className="text-[var(--ink-soft)] text-sm">
                  Pick at least one free list — then your download unlocks instantly.
                </DialogDescription>
              </DialogHeader>
            )}
          </div>

          <div className="space-y-4 px-6 pb-6 pt-3">
            {gateStep === "email" && (
              <form onSubmit={submitEmail} className="space-y-3">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-full border-2 border-[var(--border)] bg-white px-4 text-base"
                  autoFocus
                />
                <Button type="submit" size="lg" className="w-full">
                  Get my printable
                </Button>
                <p className="text-center text-[11px] leading-relaxed text-[var(--ink-soft)]">
                  By continuing you agree to receive your free printable by email and accept our{" "}
                  <Link href="/terms" className="font-semibold underline" target="_blank">
                    Terms
                  </Link>{" "}
                  &amp;{" "}
                  <Link href="/privacy" className="font-semibold underline" target="_blank">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            )}

            {gateStep === "lists" && (
              <>
                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                  {NEWSLETTER_LISTS.map((list) => {
                    const checked = pickedLists.includes(list.id);
                    return (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => toggleList(list.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                          checked
                            ? "border-[var(--kiwi)] bg-[var(--kiwi)]/10 shadow-[0_3px_0_0_color-mix(in_oklab,var(--ink)_10%,transparent)]"
                            : "border-[var(--border)] bg-white hover:border-[var(--kiwi)]/50"
                        }`}
                      >
                        <CheckCircle2
                          className={`mt-0.5 h-5 w-5 shrink-0 ${
                            checked ? "text-[var(--kiwi)]" : "text-[var(--border)]"
                          }`}
                        />
                        <span>
                          <span className="block font-display text-sm font-bold text-[var(--ink)]">
                            {list.title}
                          </span>
                          <span className="block text-xs text-[var(--ink-soft)]">
                            {list.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={subscribeAndUnlock}
                  disabled={pickedLists.length === 0}
                  size="lg"
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="h-5 w-5" /> Subscribe &amp; Download
                </Button>
              </>
            )}

            {gateStep === "delivering" && (
              <div className="space-y-2 py-6 text-center">
                {showPrintAnim ? (
                  <DownloadToPrinter play />
                ) : (
                  <>
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--kiwi)]" />
                    <p className="font-display font-semibold text-[var(--ink)]">
                      Preparing your PDF…
                    </p>
                    <p className="text-sm text-[var(--ink-soft)]">
                      Sending a copy to your inbox right now.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
