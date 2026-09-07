"use client";

import { useActionState } from "react";
import Image from "next/image";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  AUTH_METHODS,
} from "@/lib/validations";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  AUTH_METHOD_LABELS,
} from "@/lib/format";
import { RemoveImageButton } from "@/components/admin/remove-image-button";
import type { ProductActionState } from "@/lib/actions/admin-products";

type ExistingImage = { id: string; url: string; alt: string };

type ProductFormProps = {
  mode: "create" | "edit";
  action: (
    state: ProductActionState,
    formData: FormData
  ) => Promise<ProductActionState>;
  productId?: string;
  initialValues?: {
    sku: string;
    brand: string;
    model: string;
    title: string;
    description: string;
    conditionNotes: string;
    dimensions: string;
    color: string;
    category: string;
    condition: string;
    priceUsd: string;
    compareAtPriceUsd: string;
    isConsignment: boolean;
    isMostWanted: boolean;
    status: string;
    authMethod: string;
    authenticatedBy: string;
  };
  existingImages?: ExistingImage[];
};

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

export function ProductForm({
  mode,
  action,
  productId,
  initialValues,
  existingImages = [],
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className={labelClass}>
            SKU
          </label>
          <input
            id="sku"
            name="sku"
            required
            defaultValue={initialValues?.sku}
            readOnly={mode === "edit"}
            placeholder="e.g. GCC26804"
            className={`${inputClass} ${mode === "edit" ? "bg-muted text-muted-foreground" : ""}`}
          />
          {mode === "edit" && (
            <p className="mt-1 text-xs text-muted-foreground">
              SKU can&apos;t be changed after a listing is created.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="brand" className={labelClass}>
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            required
            defaultValue={initialValues?.brand}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="model" className={labelClass}>
            Model
          </label>
          <input
            id="model"
            name="model"
            required
            defaultValue={initialValues?.model}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="color" className={labelClass}>
            Color
          </label>
          <input
            id="color"
            name="color"
            required
            defaultValue={initialValues?.color}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={initialValues?.title}
            placeholder="e.g. Horsebit 1955 Small Top Handle Bag in Black"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be unique — add a distinguishing detail if a similar bag is
            already listed.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            defaultValue={initialValues?.description}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="conditionNotes" className={labelClass}>
            Condition notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="conditionNotes"
            name="conditionNotes"
            rows={3}
            placeholder="e.g. Light corner wear; scratches on hardware. Shown as its own “Condition” section on the product page — leave blank to omit it."
            defaultValue={initialValues?.conditionNotes}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="dimensions" className={labelClass}>
            Size / dimensions <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="dimensions"
            name="dimensions"
            rows={2}
            placeholder='e.g. W 23.5 cm x H 17 cm x D 11.5 cm, 26" shoulder drop'
            defaultValue={initialValues?.dimensions}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            Type
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initialValues?.category ?? "handbag"}
            className={inputClass}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className={labelClass}>
            Condition
          </label>
          <select
            id="condition"
            name="condition"
            defaultValue={initialValues?.condition ?? "excellent"}
            className={inputClass}
          >
            {PRODUCT_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priceUsd" className={labelClass}>
            Price (USD)
          </label>
          <input
            id="priceUsd"
            name="priceUsd"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initialValues?.priceUsd}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="compareAtPriceUsd" className={labelClass}>
            Compare-at price (USD)
          </label>
          <input
            id="compareAtPriceUsd"
            name="compareAtPriceUsd"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues?.compareAtPriceUsd}
            placeholder="Leave blank if not on sale"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Set this higher than the price to show a strikethrough and list
            this piece under New Price Drops.
          </p>
        </div>
        {mode === "edit" && (
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialValues?.status}
              className={inputClass}
            >
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Only change this manually for corrections — checkout normally
              sets it to Sold on its own.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="isConsignment"
            name="isConsignment"
            type="checkbox"
            defaultChecked={initialValues?.isConsignment}
            className="size-4"
          />
          <label htmlFor="isConsignment" className="text-sm">
            This is a consignment item
          </label>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="isMostWanted"
            name="isMostWanted"
            type="checkbox"
            defaultChecked={initialValues?.isMostWanted}
            className="size-4"
          />
          <label htmlFor="isMostWanted" className="text-sm">
            Feature this in Most Wanted
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-medium">Authentication</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="authMethod" className={labelClass}>
              Method
            </label>
            <select
              id="authMethod"
              name="authMethod"
              defaultValue={initialValues?.authMethod ?? "entrupy"}
              className={inputClass}
            >
              {AUTH_METHODS.map((m) => (
                <option key={m} value={m}>
                  {AUTH_METHOD_LABELS[m] ?? m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="authenticatedBy" className={labelClass}>
              Authenticated by
            </label>
            <input
              id="authenticatedBy"
              name="authenticatedBy"
              required
              defaultValue={
                initialValues?.authenticatedBy ?? "PongoLux Authentication Team"
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-medium">Photos</h2>

        {existingImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {existingImages.map((img) => (
              <div key={img.id} className="space-y-1">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
                <RemoveImageButton
                  imageId={img.id}
                  productId={productId ?? ""}
                />
              </div>
            ))}
          </div>
        )}

        <label htmlFor="images" className="mt-4 block text-sm">
          {mode === "create" ? "Upload photos" : "Add more photos"}
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="mt-1 w-full text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          The first photo (in the order shown above) is used as the primary
          listing image.
        </p>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create listing"
            : "Save changes"}
      </button>
    </form>
  );
}
