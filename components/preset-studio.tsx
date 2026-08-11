"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Lock, Download, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { captureFunnelFromUrl, getFunnel, track } from "@/lib/funnel";

// Public preset shape from /api/presets (prompt templates stay server-side).
// The catalog includes built-in presets plus any created in the admin CMS.
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

// Newsletter lists mirrored from lib/kiwiz-config (kept inline-safe for the client)
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

  // email gate state
  const [gateStep, setGateStep] = useState<GateStep>("closed");
  const [email, setEmail] = useState("");
  const [pickedLists, setPickedLists] = useState<string[]>(["weekly_printable_club"]);
  const initialised = useRef(false);

  const preset = useMemo(
    () => presets.find((p) => p.id === presetId) ?? presets[0],
    [presets, presetId]
  );

  // ---- load the live preset catalog (built-ins + CMS-created) ----
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

  // ---- URL pre-fill (PRD: never re-ask what the bridge already collected) ----
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

  // ---- generate ----
  const handleGenerate = async () => {
    setIsGenerating(true);
    setLimitMessage(null);
    track("generate_clicked", { preset: preset.id, options: values });

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
        track("generation_limit_reached", { preset: preset.id, loggedIn: data.loggedIn });
        return;
      }
      if (response.status === 422) {
        toast.error(data.message ?? "That topic isn't suitable for kids.");
        track("generation_safety_blocked", { preset: preset.id });
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.error ?? "generation failed");

      setResult(data);
      track("generation_succeeded", { preset: preset.id, fallback: data.fallback });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create your worksheet. Please try again.");
      track("generation_failed", { preset: preset.id });
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- email gate ----
  const openGate = () => {
    track("email_gate_shown", { preset: preset.id });
    // returning visitor who already passed the gate: go straight to delivery
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
          topic: optionValue("topic") || optionValue("subject") || optionValue("letter") || optionValue("number"),
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
    setPickedLists((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
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
        // gate not actually passed on the server (e.g. cleared DB) → show gate
        localStorage.removeItem(GATE_EMAIL_KEY);
        setGateStep(skippedGate ? "email" : "lists");
        if (!skippedGate) toast.error(data.message ?? "Join a newsletter to unlock.");
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error ?? "delivery failed");

      downloadPdf(data.pdfBase64, data.filename);
      track("pdf_downloaded", { preset: preset.id, emailed: data.emailed });

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
        // PDF too large for sessionStorage — thank-you page will degrade gracefully
        try {
          sessionStorage.setItem(
            "kiwiz_last_worksheet",
            JSON.stringify({ title: worksheetTitle, preset: preset.id, options: result.options, filename: data.filename, emailed: data.emailed })
          );
        } catch {}
      }

      setGateStep("closed");
      router.push("/thank-you");
    } catch (err) {
      console.error(err);
      setGateStep("closed");
      toast.error("Couldn't deliver your PDF. Please try again.");
    }
  };

  // ============================ UI ============================
  if (catalogError) {
    return (
      <Card className="p-8 text-center bg-white/90 border-orange-200 rounded-2xl">
        <p className="text-gray-700 font-semibold">Couldn't load the worksheet templates.</p>
        <Button onClick={() => location.reload()} className="mt-4 rounded-full bg-orange-500 text-white">
          Try again
        </Button>
      </Card>
    );
  }
  if (!preset) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* preset picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPresetId(p.id);
              setResult(null);
              track("preset_selected", { preset: p.id });
            }}
            className={`rounded-2xl border-2 p-4 text-center transition-all ${
              p.id === preset.id
                ? "border-orange-500 bg-orange-50 shadow-lg scale-105"
                : "border-orange-200 bg-white hover:border-orange-400"
            }`}
          >
            <div className="text-3xl">{p.emoji}</div>
            <div className="mt-1 font-bold text-sm text-orange-800">{p.title}</div>
          </button>
        ))}
      </div>

      {/* options form */}
      <Card className="p-6 bg-white/90 border-orange-200 rounded-2xl shadow-lg space-y-5">
        <p className="text-sm text-gray-600">{preset.description}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {preset.options.map((opt) => {
            const current = optionValue(opt.key);
            const isCustom = opt.allowCustom && !!customText[opt.key];
            return (
              <div key={opt.key} className="space-y-1.5">
                <label className="text-sm font-semibold text-orange-800">{opt.label}</label>
                <div className="flex flex-wrap gap-1.5">
                  {opt.values.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setCustomText((prev) => ({ ...prev, [opt.key]: "" }));
                        setOption(opt.key, v);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                        current === v && !isCustom
                          ? "bg-orange-500 text-white border-orange-600"
                          : "bg-white text-gray-700 border-orange-200 hover:border-orange-400"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {opt.allowCustom && (
                  <Input
                    value={customText[opt.key] ?? ""}
                    onChange={(e) => {
                      setCustomText((prev) => ({ ...prev, [opt.key]: e.target.value }));
                      setOption(opt.key, e.target.value);
                    }}
                    placeholder="…or type your own"
                    className="mt-1 border-orange-200"
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
          className="w-full rounded-full bg-orange-500 py-6 text-lg font-bold text-white hover:bg-orange-600 shadow-lg hover:scale-[1.02] transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating your worksheet…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" /> Generate my worksheet
            </>
          )}
        </Button>

        {limitMessage && (
          <div className="rounded-xl bg-yellow-100 border border-yellow-300 p-4 text-center text-sm text-gray-800">
            {limitMessage}{" "}
            <a href="/api/auth/login" className="font-bold text-orange-600 underline">
              Log in
            </a>
          </div>
        )}
      </Card>

      {/* preview: visible but watermarked; download locked until gate passed */}
      {result && (
        <Card className="p-6 bg-white border-orange-200 rounded-2xl shadow-xl text-center space-y-4">
          <h3 className="text-xl font-extrabold text-orange-700">Your worksheet is ready! 🎉</h3>
          <div className="relative mx-auto max-w-md select-none">
            <img
              src={result.imageUrl}
              alt={worksheetTitle}
              className="w-full rounded-lg border-2 border-orange-300 shadow-md pointer-events-none"
              draggable={false}
            />
            {/* watermark overlay */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
              <div className="rotate-[-30deg] text-4xl font-black text-orange-500/25 whitespace-nowrap">
                KIWIZ PREVIEW · KIWIZ PREVIEW
              </div>
            </div>
          </div>
          {result.fallback && (
            <p className="text-xs text-gray-500">
              We served one of our ready-made pages this time — hit generate to try again.
            </p>
          )}
          <Button
            onClick={openGate}
            className="rounded-full bg-blue-600 px-8 py-6 text-lg font-bold text-white hover:bg-blue-700 shadow-lg hover:scale-105 transition-all"
          >
            <Lock className="mr-2 h-5 w-5" /> Enter email to download the PDF
          </Button>
          <p className="text-xs text-gray-500">
            {result.remaining} of {result.limit} free worksheets left today
          </p>
        </Card>
      )}

      {/* ---- email gate dialog ---- */}
      <Dialog open={gateStep !== "closed"} onOpenChange={(open) => !open && gateStep !== "delivering" && setGateStep("closed")}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-orange-300 bg-white">
          {gateStep === "email" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold text-orange-700 flex items-center gap-2">
                  <Mail className="h-6 w-6" /> Almost yours!
                </DialogTitle>
                <DialogDescription>
                  Enter your email to download <strong>{worksheetTitle}</strong> as a print-ready PDF. We'll also send it to your inbox.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submitEmail} className="space-y-3">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-orange-200"
                />
                <Button type="submit" className="w-full rounded-full bg-orange-500 font-bold text-white hover:bg-orange-600">
                  Get my printable
                </Button>
                <p className="text-[11px] text-gray-500 text-center">
                  By continuing you agree to receive your free printable by email and accept our Terms &amp; Privacy Policy.
                </p>
              </form>
            </>
          )}

          {gateStep === "lists" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold text-orange-700">One last step 💌</DialogTitle>
                <DialogDescription>Pick at least one to join — then your download unlocks instantly.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {NEWSLETTER_LISTS.map((list) => {
                  const checked = pickedLists.includes(list.id);
                  return (
                    <button
                      key={list.id}
                      onClick={() => toggleList(list.id)}
                      className={`w-full rounded-xl border-2 p-3 text-left transition-all flex items-start gap-3 ${
                        checked ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${checked ? "text-orange-500" : "text-gray-300"}`} />
                      <span>
                        <span className="block font-bold text-sm text-gray-900">{list.title}</span>
                        <span className="block text-xs text-gray-500">{list.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={subscribeAndUnlock}
                disabled={pickedLists.length === 0}
                className="w-full rounded-full bg-green-500 py-5 font-bold text-white hover:bg-green-600"
              >
                <Download className="mr-2 h-5 w-5" /> Subscribe &amp; Download
              </Button>
            </>
          )}

          {gateStep === "delivering" && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-500" />
              <p className="font-semibold text-gray-700">Preparing your PDF and sending it to your inbox…</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
