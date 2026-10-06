"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { FieldLabel, Panel } from "@/components/admin/ui";
import { cn, pluralise } from "@/lib/format";
import { deleteCategory, saveCategory, type CategoryInput, type CategoryResult } from "@/server/actions/categories";
import type { Category } from "@/types";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

interface Props {
  category?: Category;
  /** Other categories (for “move products to”). */
  others: Category[];
  productCount: number;
}

export function CategoryForm({ category, others, productCount }: Props) {
  const router = useRouter();
  const [d, setD] = useState<CategoryInput>({ name: category?.name ?? "", slug: category?.slug ?? "", description: category?.description ?? "" });
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [errors, setErrors] = useState<CategoryResult["fieldErrors"]>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [moveTo, setMoveTo] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const set = (k: keyof CategoryInput, v: string) => {
    setD((p) => ({ ...p, [k]: v, ...(k === "name" && !slugTouched ? { slug: slugify(v) } : {}) }));
    setMessage(null);
  };
  const renaming = Boolean(category && d.slug && d.slug !== category.slug);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveCategory(d, category?.slug);
    setSaving(false);
    setErrors(res.fieldErrors ?? {});
    if (!res.ok) {
      setMessage({ ok: false, text: res.error ?? "Couldn’t save." });
      return;
    }
    setMessage({ ok: true, text: "Saved! The website is updated." });
    router.refresh();
  }

  async function onDelete() {
    if (!category) return;
    if (productCount > 0 && !moveTo) {
      setDeleteError("Choose a category to move the products to.");
      return;
    }
    if (!confirm(`Delete the category “${category.name}”?`)) return;
    setDeleting(true);
    const res = await deleteCategory(category.slug, moveTo || undefined);
    // On success the action redirects to the category list.
    setDeleting(false);
    setDeleteError(res.error ?? "Couldn’t delete.");
  }

  const err = (k: keyof CategoryInput) =>
    errors?.[k] && (
      <p className="field-error" role="alert">
        {errors[k]}
      </p>
    );

  return (
    <div className="space-y-6">
      <form onSubmit={onSave}>
        <Panel title="Category details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="cat-name">Name</FieldLabel>
              <input id="cat-name" value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={40} className="input py-2.5" placeholder="e.g. Hair Clips" aria-invalid={Boolean(errors?.name)} />
              {err("name")}
            </div>
            <div>
              <FieldLabel htmlFor="cat-slug" hint="Used in shop links, e.g. /shop?category=hair-clips">
                Web address
              </FieldLabel>
              <input
                id="cat-slug"
                value={d.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                className="input py-2.5"
                aria-invalid={Boolean(errors?.slug)}
              />
              {err("slug")}
              {renaming && (
                <p className="mt-1 text-xs font-semibold text-sunny-deep">
                  Changing the web address moves {pluralise(productCount, "product")} with it automatically. Old shared links to this filter will stop working.
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="cat-description" optional hint="Shown on the shop page when customers filter by this category.">
                Short description
              </FieldLabel>
              <input id="cat-description" value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={200} className="input py-2.5" placeholder="e.g. Cute clips and pins for every hairstyle." />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save className="h-5 w-5" aria-hidden /> {saving ? "Saving…" : category ? "Save changes" : "Create category"}
            </button>
            {message && (
              <p role="status" className={cn("text-sm font-bold", message.ok ? "text-mint-deep" : "text-pink-deep")}>
                {message.text}
              </p>
            )}
          </div>
        </Panel>
      </form>

      {category && (
        <Panel title="Delete category" description={productCount ? `${pluralise(productCount, "product")} use this category — choose where they should go first.` : "No products use this category."}>
          {productCount > 0 && (
            <div className="mb-4 max-w-sm">
              <FieldLabel htmlFor="cat-move">Move its products to</FieldLabel>
              <select
                id="cat-move"
                value={moveTo}
                onChange={(e) => {
                  setMoveTo(e.target.value);
                  setDeleteError("");
                }}
                className="input py-2.5"
              >
                <option value="">Choose a category…</option>
                {others.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onDelete} disabled={deleting || !others.length} className="btn btn-secondary btn-sm text-pink-deep">
              <Trash2 className="h-4 w-4" aria-hidden /> {deleting ? "Deleting…" : "Delete category"}
            </button>
            {!others.length && <p className="text-sm text-ink-soft">The shop needs at least one category.</p>}
            {deleteError && (
              <p role="alert" className="text-sm font-bold text-pink-deep">
                {deleteError}
              </p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
