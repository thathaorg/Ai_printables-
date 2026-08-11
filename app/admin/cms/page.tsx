"use client";

// KIWIZ CMS — create bridge pages and worksheet presets from a form.
// No code needed: everything saves to the database and goes live instantly.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

// ---------- shared types (mirror lib/bridges + lib/presets) ----------
interface PresetOptionForm {
  key: string;
  label: string;
  values: string; // comma-separated in the form
  default: string;
  allowCustom: boolean;
}
interface PublicPreset {
  id: string;
  title: string;
  emoji: string;
  description: string;
  options: { key: string; label: string; values: string[]; allowCustom?: boolean; default?: string }[];
  tags: string[];
}

const TEMPLATE_CHOICES = [
  { value: "offer", label: "Offer page — one big button, no questions" },
  { value: "letter_picker", label: "Letter picker — visitor picks A–Z" },
  { value: "number_picker", label: "Number picker — visitor picks 0–9" },
  { value: "theme_picker", label: "Theme picker — visitor picks one of your options" },
  { value: "age_gate", label: "Age gate — visitor picks an age" },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

// ============================================================
export default function CmsPage() {
  const [tab, setTab] = useState<"bridges" | "presets">("bridges");
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Content Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Launch new bridge pages and worksheet templates without touching code. Changes go live immediately.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === "bridges" ? "default" : "outline"}
          onClick={() => setTab("bridges")}
          className="rounded-full"
        >
          Bridge pages
        </Button>
        <Button
          variant={tab === "presets" ? "default" : "outline"}
          onClick={() => setTab("presets")}
          className="rounded-full"
        >
          Worksheet presets
        </Button>
      </div>

      {tab === "bridges" ? <BridgesTab /> : <PresetsTab />}
    </div>
  );
}

// ============================================================
// Bridge pages tab
// ============================================================
function BridgesTab() {
  const [builtIn, setBuiltIn] = useState<any[]>([]);
  const [cms, setCms] = useState<any[]>([]);
  const [presets, setPresets] = useState<PublicPreset[]>([]);
  const [editing, setEditing] = useState<any | null>(null); // form state or null
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bridgeData, presetData] = await Promise.all([
        jsonFetch("/admin/cms/api/bridges"),
        jsonFetch("/api/presets"),
      ]);
      setBuiltIn(bridgeData.builtIn ?? []);
      setCms(bridgeData.cms ?? []);
      setPresets(presetData.presets ?? []);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyForm = {
    headline: "",
    subline: "",
    cta: "Get my free printable",
    emoji: "✨",
    template: "offer",
    bridgeId: "",
    idTouched: false,
    options: "",
    payloadKey: "",
    preset: presets[0]?.id ?? "coloring_page",
    prefills: {} as Record<string, string>,
  };

  const startEdit = (config: any) => {
    const { preset, ...rest } = config.payload ?? {};
    setEditing({
      headline: config.headline ?? "",
      subline: config.subline ?? "",
      cta: config.cta ?? "Get my free printable",
      emoji: config.emoji ?? "✨",
      template: config.template ?? "offer",
      bridgeId: config.bridgeId ?? "",
      idTouched: true,
      options: (config.options ?? []).join(", "),
      payloadKey: config.payloadKey ?? "",
      preset: preset ?? presets[0]?.id ?? "coloring_page",
      prefills: rest,
    });
  };

  const selectedPreset = useMemo(
    () => presets.find((p) => p.id === editing?.preset),
    [presets, editing?.preset]
  );

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { preset: editing.preset };
      for (const [k, v] of Object.entries(editing.prefills as Record<string, string>)) {
        if (v) payload[k] = v;
      }
      await jsonFetch("/admin/cms/api/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bridgeId: editing.bridgeId || slugify(editing.headline),
          template: editing.template,
          headline: editing.headline,
          subline: editing.subline,
          cta: editing.cta,
          emoji: editing.emoji,
          options: editing.options
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
          payloadKey:
            editing.template === "letter_picker"
              ? "letter"
              : editing.template === "number_picker"
                ? "number"
                : editing.payloadKey || undefined,
          payload,
        }),
      });
      toast.success("Bridge page saved and live!");
      setEditing(null);
      void load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (bridgeId: string) => {
    navigator.clipboard.writeText(`${location.origin}/free/${bridgeId}`);
    toast.success("Link copied!");
  };

  const needsOptions = editing?.template === "theme_picker" || editing?.template === "age_gate";

  return (
    <div className="space-y-6">
      {!editing && (
        <Button onClick={() => setEditing(emptyForm)} className="rounded-full">
          <Plus className="h-4 w-4 mr-1" /> New bridge page
        </Button>
      )}

      {editing && (
        <Card className="p-5 space-y-4 border-2 border-primary/30">
          <h2 className="font-bold text-lg">{editing.idTouched ? "Edit bridge page" : "New bridge page"}</h2>

          <Field label="Headline" hint="The big promise visitors see first">
            <Input
              value={editing.headline}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  headline: e.target.value,
                  bridgeId: editing.idTouched ? editing.bridgeId : slugify(e.target.value),
                })
              }
              placeholder="Free Halloween Coloring Pages"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Subline" hint="One supporting sentence">
              <Input
                value={editing.subline}
                onChange={(e) => setEditing({ ...editing, subline: e.target.value })}
                placeholder="Pick a style — your printable is seconds away"
              />
            </Field>
            <Field label="Button text">
              <Input value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Emoji">
              <Input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
            </Field>
            <Field label="Page type" hint="What the visitor is asked">
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={editing.template}
                onChange={(e) => setEditing({ ...editing, template: e.target.value })}
              >
                {TEMPLATE_CHOICES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Link name" hint={`URL: /free/${editing.bridgeId || "…"}`}>
              <Input
                value={editing.bridgeId}
                onChange={(e) => setEditing({ ...editing, bridgeId: slugify(e.target.value), idTouched: true })}
              />
            </Field>
          </div>

          <Field label="Worksheet it leads to" hint="Which template opens on /create">
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={editing.preset}
              onChange={(e) => setEditing({ ...editing, preset: e.target.value, prefills: {}, payloadKey: "" })}
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.title}
                </option>
              ))}
            </select>
          </Field>

          {needsOptions && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Choices shown to the visitor" hint="Separate with commas">
                <Input
                  value={editing.options}
                  onChange={(e) => setEditing({ ...editing, options: e.target.value })}
                  placeholder="Cute, Simple, Realistic"
                />
              </Field>
              <Field label="Their pick fills…" hint="Which worksheet field the choice answers">
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.payloadKey}
                  onChange={(e) => setEditing({ ...editing, payloadKey: e.target.value })}
                >
                  <option value="">— choose a field —</option>
                  {(selectedPreset?.options ?? []).map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label} ({o.key})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {selectedPreset && (
            <Field
              label="Pre-filled answers (optional)"
              hint="Answers the bridge already gives, so visitors aren't asked again"
            >
              <div className="grid sm:grid-cols-2 gap-2">
                {selectedPreset.options
                  .filter((o) => o.key !== editing.payloadKey)
                  .map((o) => (
                    <div key={o.key} className="flex items-center gap-2">
                      <span className="text-xs w-24 shrink-0 text-muted-foreground">{o.label}</span>
                      <select
                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                        value={editing.prefills[o.key] ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, prefills: { ...editing.prefills, [o.key]: e.target.value } })
                        }
                      >
                        <option value="">Ask the visitor</option>
                        {o.values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </Field>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? "Saving…" : "Save & publish"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-full">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <ItemList
        title="Your bridge pages"
        empty="None yet — create your first bridge page above."
        items={cms.map((row) => ({
          key: row.id,
          emoji: row.config?.emoji ?? "✨",
          title: row.config?.headline ?? row.bridgeId,
          sub: `/free/${row.bridgeId} · ${row.enabled ? "live" : "off"}`,
          actions: (
            <>
              <IconBtn title="Copy link" onClick={() => copyLink(row.bridgeId)}>
                <Copy className="h-4 w-4" />
              </IconBtn>
              <a href={`/free/${row.bridgeId}`} target="_blank" rel="noreferrer">
                <IconBtn title="Open">
                  <ExternalLink className="h-4 w-4" />
                </IconBtn>
              </a>
              <IconBtn title="Edit" onClick={() => startEdit({ ...row.config, bridgeId: row.bridgeId })}>
                <Pencil className="h-4 w-4" />
              </IconBtn>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs h-7"
                onClick={async () => {
                  try {
                    await jsonFetch(`/admin/cms/api/bridges/${row.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enabled: !row.enabled }),
                    });
                    void load();
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                {row.enabled ? "Turn off" : "Turn on"}
              </Button>
              <IconBtn
                title="Delete"
                onClick={async () => {
                  if (!confirm(`Delete bridge page "${row.bridgeId}"?`)) return;
                  try {
                    await jsonFetch(`/admin/cms/api/bridges/${row.id}`, { method: "DELETE" });
                    void load();
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </IconBtn>
            </>
          ),
        }))}
      />

      <ItemList
        title="Built-in bridge pages"
        empty=""
        items={builtIn.map((b) => ({
          key: b.bridgeId,
          emoji: b.emoji,
          title: b.headline,
          sub: `/free/${b.bridgeId} · built-in`,
          actions: (
            <>
              <IconBtn title="Copy link" onClick={() => copyLink(b.bridgeId)}>
                <Copy className="h-4 w-4" />
              </IconBtn>
              <a href={`/free/${b.bridgeId}`} target="_blank" rel="noreferrer">
                <IconBtn title="Open">
                  <ExternalLink className="h-4 w-4" />
                </IconBtn>
              </a>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs h-7"
                onClick={() => startEdit(b)}
              >
                Customize
              </Button>
            </>
          ),
        }))}
      />
    </div>
  );
}

// ============================================================
// Presets tab
// ============================================================
function PresetsTab() {
  const [builtIn, setBuiltIn] = useState<any[]>([]);
  const [cms, setCms] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await jsonFetch("/admin/cms/api/presets");
      setBuiltIn(data.builtIn ?? []);
      setCms(data.cms ?? []);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyForm = {
    title: "",
    emoji: "📄",
    description: "",
    presetId: "",
    idTouched: false,
    promptTemplate:
      "Black and white line-art worksheet for a {age}-year-old child.\nSubject: {topic}.\nThick clean outlines, large white regions, no small details, print-ready A4 layout,\n\"Name: ____ Date: ____\" header on one line at the very top.\nNo colors, no shading, kid-friendly, safe for children.",
    tags: "",
    options: [
      { key: "topic", label: "Topic", values: "Animals, Space, Ocean", default: "Animals", allowCustom: true },
      { key: "age", label: "Age", values: "2-3, 4-5", default: "4-5", allowCustom: false },
    ] as PresetOptionForm[],
  };

  const startEdit = (config: any, presetId: string) => {
    setEditing({
      title: config.title ?? "",
      emoji: config.emoji ?? "📄",
      description: config.description ?? "",
      presetId,
      idTouched: true,
      promptTemplate: config.promptTemplate ?? "",
      tags: (config.tags ?? []).join(", "),
      options: (config.options ?? []).map((o: any) => ({
        key: o.key,
        label: o.label,
        values: (o.values ?? []).join(", "),
        default: o.default ?? "",
        allowCustom: !!o.allowCustom,
      })),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await jsonFetch("/admin/cms/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.presetId || slugify(editing.title),
          title: editing.title,
          emoji: editing.emoji,
          description: editing.description,
          promptTemplate: editing.promptTemplate,
          tags: editing.tags.split(",").map((s: string) => s.trim()).filter(Boolean),
          options: editing.options.map((o: PresetOptionForm) => ({
            key: o.key,
            label: o.label,
            values: o.values.split(",").map((s) => s.trim()).filter(Boolean),
            default: o.default || undefined,
            allowCustom: o.allowCustom,
          })),
        }),
      });
      toast.success("Preset saved — it's live on /create!");
      setEditing(null);
      void load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!editing && (
        <Button onClick={() => setEditing(emptyForm)} className="rounded-full">
          <Plus className="h-4 w-4 mr-1" /> New worksheet preset
        </Button>
      )}

      {editing && (
        <Card className="p-5 space-y-4 border-2 border-primary/30">
          <h2 className="font-bold text-lg">{editing.idTouched ? "Edit preset" : "New worksheet preset"}</h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Title">
              <Input
                value={editing.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    title: e.target.value,
                    presetId: editing.idTouched ? editing.presetId : slugify(e.target.value),
                  })
                }
                placeholder="Maze Adventure"
              />
            </Field>
            <Field label="Emoji">
              <Input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
            </Field>
            <Field label="ID" hint="Used in links, lowercase">
              <Input
                value={editing.presetId}
                onChange={(e) => setEditing({ ...editing, presetId: slugify(e.target.value), idTouched: true })}
              />
            </Field>
          </div>

          <Field label="Short description" hint="Shown under the template on /create">
            <Input
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="A fun maze with a start and finish"
            />
          </Field>

          <Field
            label="AI instructions (prompt template)"
            hint={`Write what the AI should draw. Use {curly} placeholders for the options below — e.g. {topic}, {age}. Parents never see this.`}
          >
            <textarea
              className="w-full min-h-36 rounded-md border border-input bg-background p-3 text-sm font-mono"
              value={editing.promptTemplate}
              onChange={(e) => setEditing({ ...editing, promptTemplate: e.target.value })}
            />
          </Field>

          <Field label="Options parents can choose" hint="Each option becomes buttons on /create. The 'key' must match a {placeholder} above.">
            <div className="space-y-2">
              {editing.options.map((o: PresetOptionForm, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-2"
                    placeholder="key"
                    value={o.key}
                    onChange={(e) => {
                      const options = [...editing.options];
                      options[i] = { ...o, key: e.target.value.replace(/[^a-zA-Z0-9]/g, "") };
                      setEditing({ ...editing, options });
                    }}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Label"
                    value={o.label}
                    onChange={(e) => {
                      const options = [...editing.options];
                      options[i] = { ...o, label: e.target.value };
                      setEditing({ ...editing, options });
                    }}
                  />
                  <Input
                    className="col-span-4"
                    placeholder="Choices, separated by commas"
                    value={o.values}
                    onChange={(e) => {
                      const options = [...editing.options];
                      options[i] = { ...o, values: e.target.value };
                      setEditing({ ...editing, options });
                    }}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Default"
                    value={o.default}
                    onChange={(e) => {
                      const options = [...editing.options];
                      options[i] = { ...o, default: e.target.value };
                      setEditing({ ...editing, options });
                    }}
                  />
                  <label className="col-span-1 flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={o.allowCustom}
                      onChange={(e) => {
                        const options = [...editing.options];
                        options[i] = { ...o, allowCustom: e.target.checked };
                        setEditing({ ...editing, options });
                      }}
                    />
                    free
                  </label>
                  <button
                    className="col-span-1 text-red-500 text-sm"
                    onClick={() => setEditing({ ...editing, options: editing.options.filter((_: any, j: number) => j !== i) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs"
                onClick={() =>
                  setEditing({
                    ...editing,
                    options: [...editing.options, { key: "", label: "", values: "", default: "", allowCustom: false }],
                  })
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add option
              </Button>
            </div>
          </Field>

          <Field label="Tags" hint="Comma-separated — used for recommendations and email segments">
            <Input
              value={editing.tags}
              onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
              placeholder="mazes, seasonal"
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? "Saving…" : "Save & publish"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-full">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <ItemList
        title="Your presets"
        empty="None yet — create your first preset above."
        items={cms.map((row) => ({
          key: row.id,
          emoji: row.config?.emoji ?? "📄",
          title: row.config?.title ?? row.presetId,
          sub: `${row.presetId} · ${row.enabled ? "live" : "off"}`,
          actions: (
            <>
              <IconBtn title="Edit" onClick={() => startEdit(row.config, row.presetId)}>
                <Pencil className="h-4 w-4" />
              </IconBtn>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs h-7"
                onClick={async () => {
                  try {
                    await jsonFetch(`/admin/cms/api/presets/${row.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enabled: !row.enabled }),
                    });
                    void load();
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                {row.enabled ? "Turn off" : "Turn on"}
              </Button>
              <IconBtn
                title="Delete"
                onClick={async () => {
                  if (!confirm(`Delete preset "${row.presetId}"?`)) return;
                  try {
                    await jsonFetch(`/admin/cms/api/presets/${row.id}`, { method: "DELETE" });
                    void load();
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </IconBtn>
            </>
          ),
        }))}
      />

      <ItemList
        title="Built-in presets"
        empty=""
        items={builtIn.map((p) => ({
          key: p.id,
          emoji: p.emoji,
          title: p.title,
          sub: `${p.id} · built-in`,
          actions: (
            <Button size="sm" variant="outline" className="rounded-full text-xs h-7" onClick={() => startEdit(p, p.id)}>
              Customize
            </Button>
          ),
        }))}
      />
    </div>
  );
}

// ---------- small shared UI helpers ----------
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-md hover:bg-muted transition-colors"
      type="button"
    >
      {children}
    </button>
  );
}

function ItemList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { key: string; emoji: string; title: string; sub: string; actions: React.ReactNode }[];
}) {
  if (items.length === 0 && !empty) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        items.map((item) => (
          <Card key={item.key} className="p-3 flex items-center gap-3">
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
            </div>
            <div className="flex items-center gap-1">{item.actions}</div>
          </Card>
        ))
      )}
    </div>
  );
}
