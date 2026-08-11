"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BridgeConfig, BridgeQuizStep } from "@/lib/bridges";

const PRESET_LABELS: Record<string, string> = {
  coloring_page: "Coloring page",
  alphabet_tracing: "Alphabet tracing",
  number_tracing: "Number tracing",
  counting_worksheet: "Counting worksheet",
};

function buildCreateUrl(
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

type Props = {
  bridge: BridgeConfig;
  utm: Record<string, string>;
  pickerValues: string[];
};

export default function BridgeInteractive({ bridge, utm, pickerValues }: Props) {
  if (bridge.template === "mini_quiz" && bridge.quizSteps?.length) {
    return <MiniQuiz bridge={bridge} utm={utm} />;
  }

  if (bridge.template === "teacher") {
    return <TeacherPicker bridge={bridge} utm={utm} pickerValues={pickerValues} />;
  }

  if (bridge.template === "offer") {
    return (
      <Link
        href={buildCreateUrl(bridge, utm)}
        data-bridge-cta="true"
        className="btn-chunky btn-primary-chunky mt-8 inline-flex px-8 py-4 text-lg"
      >
        {bridge.cta} →
      </Link>
    );
  }

  // letter / number / theme / age pickers
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
      {pickerValues.map((value) => (
        <Link
          key={value}
          href={buildCreateUrl(
            bridge,
            utm,
            bridge.payloadKey ? { [bridge.payloadKey]: value } : undefined
          )}
          data-bridge-option={value}
          className={chipClass(value)}
        >
          {labelFor(bridge, value)}
        </Link>
      ))}
    </div>
  );
}

function MiniQuiz({
  bridge,
  utm,
}: {
  bridge: BridgeConfig;
  utm: Record<string, string>;
}) {
  const steps = bridge.quizSteps as BridgeQuizStep[];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = steps[step];
  const done = step >= steps.length;

  const href = useMemo(
    () => buildCreateUrl(bridge, utm, answers),
    [bridge, utm, answers]
  );

  if (done) {
    return (
      <div className="mt-8 space-y-4">
        <p className="text-sm text-[var(--ink-soft)]">Perfect — your free printable is ready to generate.</p>
        <Link href={href} data-bridge-cta="true" className="btn-chunky btn-primary-chunky inline-flex px-8 py-4 text-lg">
          {bridge.cta} →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-6 rounded-full ${i <= step ? "bg-[var(--kiwi)]" : "bg-black/10"}`}
          />
        ))}
      </div>
      <p className="font-display text-lg font-bold text-[var(--ink)]">{current.question}</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        {current.options.map((value) => (
          <button
            key={value}
            type="button"
            data-bridge-option={value}
            className={chipClass(value)}
            onClick={() => {
              const next = { ...answers, [current.payloadKey]: value };
              setAnswers(next);
              setStep((s) => s + 1);
            }}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeacherPicker({
  bridge,
  utm,
  pickerValues,
}: {
  bridge: BridgeConfig;
  utm: Record<string, string>;
  pickerValues: string[];
}) {
  return (
    <div className="mt-8 space-y-3">
      <p className="text-sm font-medium text-[var(--ink-soft)]">Choose a classroom worksheet type</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        {pickerValues.map((value) => {
          const isPreset = !!PRESET_LABELS[value] || value.includes("_");
          const extra = isPreset
            ? { preset: value, ...(bridge.payloadKey && bridge.payloadKey !== "preset"
                ? {}
                : {}) }
            : bridge.payloadKey
              ? { [bridge.payloadKey]: value }
              : {};
          // Teacher bridges: option value is a preset id when matching known presets
          const params = PRESET_LABELS[value]
            ? { preset: value }
            : extra;
          return (
            <Link
              key={value}
              href={buildCreateUrl(bridge, utm, params)}
              data-bridge-option={value}
              className="min-w-[140px] rounded-2xl bg-[#F7F8FA] px-5 py-3 text-center font-display text-sm font-bold text-[var(--ink)] shadow-[0_3px_0_0_rgba(30,41,53,0.08)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[var(--ink)] hover:text-white"
            >
              {PRESET_LABELS[value] ?? value}
            </Link>
          );
        })}
      </div>
      <Link
        href={buildCreateUrl(bridge, utm)}
        data-bridge-cta="true"
        className="mt-2 inline-block text-sm font-semibold text-[var(--kiwi-deep)] underline"
      >
        Or continue with recommended pack →
      </Link>
    </div>
  );
}

function chipClass(value: string) {
  return `rounded-2xl bg-[#F7F8FA] font-display font-bold text-[var(--ink)] shadow-[0_3px_0_0_rgba(30,41,53,0.08)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[var(--ink)] hover:text-white ${
    value.length <= 2
      ? "flex h-12 w-12 items-center justify-center text-lg"
      : "px-5 py-2.5 text-sm"
  }`;
}

function labelFor(bridge: BridgeConfig, value: string) {
  if (bridge.template === "teacher") return PRESET_LABELS[value] ?? value;
  return value;
}
