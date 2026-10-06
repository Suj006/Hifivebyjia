"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { FieldLabel, Panel } from "@/components/admin/ui";
import { THEME_CLASSES } from "@/components/product/CollectionCard";
import { AUDIENCE_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { saveCollections } from "@/server/actions/settings";
import type { Audience, Category, Collection, CollectionTheme } from "@/types";

const THEMES = Object.keys(THEME_CLASSES) as CollectionTheme[];
const AUDIENCES: Audience[] = ["kids", "teens", "adults", "women", "families", "everyone"];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

type Row = Collection & { isNew?: boolean; key: string; tagsText: string };

let k = 0;
const key = () => `k${++k}`;

export function CollectionsEditor({ collections, categories }: { collections: Collection[]; categories: Category[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => collections.map((c) => ({ ...c, key: key(), tagsText: (c.rule?.tags ?? []).join(", ") })));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, to: number) =>
    setRows((r) => {
      if (to < 0 || to >= r.length) return r;
      const next = [...r];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });
  const toggleRule = (i: number, kind: "category" | "audience", value: string) => {
    const current = (rows[i].rule?.[kind] as string[] | undefined) ?? [];
    update(i, { rule: { ...rows[i].rule, [kind]: current.includes(value) ? current.filter((x) => x !== value) : [...current, value] } });
  };

  async function saveCols() {
    setSaving(true);
    const res = await saveCollections(
      rows.map((r) => ({ ...r, rule: { ...r.rule, tags: r.tagsText.split(",").map((t) => t.trim()).filter(Boolean) } })),
    );
    setSaving(false);
    setMsg({ ok: res.ok, text: res.ok ? "Collections saved! The website is updated." : res.error ?? "Couldn’t save." });
    if (res.ok) {
      setRows((r) => r.map((x) => ({ ...x, isNew: false })));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Panel title="Collections" description="Shown in “Shop by Collection”. Products join a collection when you tick it on the product, or automatically using the rules below.">
        <ul className="space-y-3">
          {rows.map((c, i) => (
            <li key={c.key} className={cn("rounded-2xl border border-line p-4", !c.visible && "opacity-70")}>
              <details open={c.isNew}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br text-xl", THEME_CLASSES[c.theme]?.bg)}>{c.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold">{c.name || "New collection"}</span>
                    <span className="block text-xs text-ink-soft">/categories/{c.slug || "…"}</span>
                  </span>
                  <span className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    <button type="button" onClick={() => update(i, { visible: !c.visible })} className="rounded-full p-2 hover:bg-pink-soft" aria-label={c.visible ? "Hide collection" : "Show collection"} title={c.visible ? "Visible" : "Hidden"}>
                      {c.visible ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
                    </button>
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded-full p-2 hover:bg-pink-soft disabled:opacity-30" aria-label="Move up">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} className="rounded-full p-2 hover:bg-pink-soft disabled:opacity-30" aria-label="Move down">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirm(`Remove the “${c.name}” collection?`) && setRows((r) => r.filter((_, j) => j !== i))}
                      className="rounded-full p-2 text-pink-deep hover:bg-pink-soft"
                      aria-label="Remove collection"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </span>
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor={`c-name-${c.key}`}>Name</FieldLabel>
                    <input
                      id={`c-name-${c.key}`}
                      value={c.name}
                      onChange={(e) => update(i, { name: e.target.value, ...(c.isNew ? { slug: slugify(e.target.value) } : {}) })}
                      className="input py-2"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`c-emoji-${c.key}`}>Emoji</FieldLabel>
                    <input id={`c-emoji-${c.key}`} value={c.emoji} onChange={(e) => update(i, { emoji: e.target.value })} className="input py-2" maxLength={8} />
                  </div>
                  {c.isNew && (
                    <div>
                      <FieldLabel htmlFor={`c-slug-${c.key}`} hint="Can’t be changed later.">
                        Web address
                      </FieldLabel>
                      <input id={`c-slug-${c.key}`} value={c.slug} onChange={(e) => update(i, { slug: slugify(e.target.value) })} className="input py-2" />
                    </div>
                  )}
                  <div>
                    <FieldLabel htmlFor={`c-tag-${c.key}`}>Tagline</FieldLabel>
                    <input id={`c-tag-${c.key}`} value={c.tagline} onChange={(e) => update(i, { tagline: e.target.value })} className="input py-2" maxLength={80} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor={`c-desc-${c.key}`}>Description</FieldLabel>
                    <input id={`c-desc-${c.key}`} value={c.description} onChange={(e) => update(i, { description: e.target.value })} className="input py-2" maxLength={300} />
                  </div>
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-1.5 text-sm font-bold">Colour</legend>
                    <div className="flex flex-wrap gap-2">
                      {THEMES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={c.theme === t}
                          aria-label={t}
                          onClick={() => update(i, { theme: t })}
                          className={cn("h-9 w-9 rounded-full bg-linear-to-br ring-offset-2", THEME_CLASSES[t].bg, c.theme === t && "ring-2 ring-pink-deep")}
                        />
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="rounded-2xl bg-[#FBF8FC] p-3 sm:col-span-2">
                    <legend className="text-sm font-bold">Add products automatically (optional)</legend>
                    <p className="mb-2 text-xs text-ink-soft">Any product in these categories, made for these people, or with these tags joins this collection.</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <RuleChip key={cat.slug} active={c.rule?.category?.includes(cat.slug) ?? false} onClick={() => toggleRule(i, "category", cat.slug)}>
                          {cat.name}
                        </RuleChip>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {AUDIENCES.map((a) => (
                        <RuleChip key={a} active={c.rule?.audience?.includes(a) ?? false} onClick={() => toggleRule(i, "audience", a)}>
                          {AUDIENCE_LABELS[a]}
                        </RuleChip>
                      ))}
                    </div>
                    <label htmlFor={`c-tags-${c.key}`} className="mt-3 block text-xs font-bold">
                      Tags (comma separated)
                    </label>
                    <input id={`c-tags-${c.key}`} value={c.tagsText} onChange={(e) => update(i, { tagsText: e.target.value })} className="input mt-1 py-2" placeholder="e.g. gift, alphabet" />
                  </fieldset>
                </div>
              </details>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRows((r) => [...r, { key: key(), isNew: true, slug: "", name: "", tagline: "", description: "", emoji: "✨", theme: "pink", rule: {}, sortOrder: r.length + 1, visible: true, tagsText: "" }])}
            className="btn btn-secondary btn-sm"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add collection
          </button>
          <button type="button" onClick={saveCols} disabled={saving} className="btn btn-primary btn-sm">
            <Save className="h-4 w-4" aria-hidden /> Save collections
          </button>
          {msg && (
            <p role="status" className={cn("text-sm font-bold", msg.ok ? "text-mint-deep" : "text-pink-deep")}>
              {msg.text}
            </p>
          )}
        </div>
      </Panel>

    </div>
  );
}

function RuleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("rounded-full border-2 px-3 py-1 text-xs font-bold", active ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-line bg-white")}>
      {children}
    </button>
  );
}
