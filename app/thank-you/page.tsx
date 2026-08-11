"use client";

// PRD: the single conversion URL. Confirmation, re-download, tag-based
// preset recommendations, more one-click newsletter joins.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { getRecommendations } from "@/lib/presets";
import { getFunnel, track } from "@/lib/funnel";

const NEWSLETTER_LISTS = [
  { id: "weekly_printable_club", title: "Weekly Printable Club" },
  { id: "alphabet_numbers", title: "Alphabet & Numbers Practice" },
  { id: "seasonal_holiday", title: "Seasonal & Holiday Printables" },
  { id: "teacher_pack", title: "Teacher Resource Pack" },
];

interface LastWorksheet {
  title: string;
  preset: string;
  options: Record<string, string>;
  filename: string;
  emailed: boolean;
  pdfBase64?: string;
}

function ThankYouContent() {
  const [last, setLast] = useState<LastWorksheet | null>(null);
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kiwiz_last_worksheet");
      if (raw) setLast(JSON.parse(raw));
    } catch {}
    track("thank_you_view", {});
  }, []);

  const redownload = () => {
    if (!last?.pdfBase64) return;
    const bytes = Uint8Array.from(atob(last.pdfBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = last.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("pdf_redownloaded", { preset: last.preset });
  };

  const joinList = async (listId: string) => {
    const email = localStorage.getItem("kiwiz_gate_email");
    if (!email) {
      toast.error("Make a worksheet first to join with one click!");
      return;
    }
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lists: [listId] }),
      });
      if (!res.ok) throw new Error();
      setJoined((prev) => [...prev, listId]);
      track("newsletter_subscribed", { lists: [listId], from: "thank_you" });
      toast.success("You're in! 🎉");
    } catch {
      toast.error("Couldn't subscribe. Please try again.");
    }
  };

  const recs = last ? getRecommendations(last.preset, last.options) : getRecommendations("coloring_page", {});
  const funnel = getFunnel();

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #fffbea 0%, #ffe4b5 40%, #ffd580 70%, #ffcf6b 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-700">
          Your printable is on its way! 🎉
        </h1>
        <p className="text-gray-700">
          {last?.emailed
            ? "Your worksheet was downloaded and a copy is in your inbox."
            : "Your worksheet was downloaded."}
          {last && (
            <>
              {" "}
              <span className="font-semibold">({last.title})</span>
            </>
          )}
        </p>

        {last?.pdfBase64 && (
          <Button onClick={redownload} variant="outline" className="rounded-full border-orange-400 text-orange-700 font-bold">
            <Download className="mr-2 h-4 w-4" /> Download again
          </Button>
        )}

        {/* tag-based recommendations */}
        <Card className="p-6 bg-white/90 border-orange-200 rounded-2xl shadow-lg text-left space-y-3">
          <h2 className="text-lg font-extrabold text-orange-700 text-center">Make another one ✨</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {recs.map((rec, i) => {
              const params = new URLSearchParams({ preset: rec.presetId, ...rec.params });
              if (funnel.bridgeId) params.set("bridge", funnel.bridgeId);
              return (
                <Link
                  key={i}
                  href={`/create?${params.toString()}`}
                  className="rounded-xl border-2 border-orange-200 bg-white p-3 text-center text-sm font-bold text-orange-800 hover:border-orange-500 hover:scale-105 transition-all"
                  onClick={() => track("recommendation_clicked", { to: rec.presetId })}
                >
                  {rec.label}
                </Link>
              );
            })}
          </div>
        </Card>

        {/* more one-click newsletter joins */}
        <Card className="p-6 bg-white/90 border-orange-200 rounded-2xl shadow-lg text-left space-y-3">
          <h2 className="text-lg font-extrabold text-orange-700 text-center flex items-center justify-center gap-2">
            <Mail className="h-5 w-5" /> More free printables in your inbox
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {NEWSLETTER_LISTS.map((list) => (
              <Button
                key={list.id}
                variant="outline"
                disabled={joined.includes(list.id)}
                onClick={() => joinList(list.id)}
                className="rounded-full border-orange-300 text-sm font-semibold text-orange-800"
              >
                {joined.includes(list.id) ? "✓ Joined" : `Join ${list.title}`}
              </Button>
            ))}
          </div>
        </Card>

        <Link href="/create" className="inline-block text-sm font-bold text-orange-600 underline">
          ← Back to the worksheet maker
        </Link>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ThankYouContent />
    </Suspense>
  );
}
