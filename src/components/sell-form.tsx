"use client";

import { useActionState } from "react";
import { PRODUCT_CONDITIONS, SELL_SUBMISSION_MIN_PHOTOS } from "@/lib/validations";
import { CONDITION_LABELS } from "@/lib/format";
import { submitSellSubmissionAction } from "@/lib/actions/sell";

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

type SellFormProps = {
  initialName?: string;
  initialEmail?: string;
};

export function SellForm({ initialName, initialEmail }: SellFormProps) {
  const [state, formAction, pending] = useActionState(
    submitSellSubmissionAction,
    null
  );

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <div className="border-b border-border pb-8">
        <h2 className="text-sm font-medium">Your contact information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className={labelClass}>
              Full name
            </label>
            <input
              id="contactName"
              name="contactName"
              required
              defaultValue={initialName}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              defaultValue={initialEmail}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contactPhone" className={labelClass}>
              Phone number
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              required
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="addressLine1" className={labelClass}>
              Street address
            </label>
            <input id="addressLine1" name="addressLine1" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="addressLine2" className={labelClass}>
              Apt / suite <span className="text-muted-foreground">(optional)</span>
            </label>
            <input id="addressLine2" name="addressLine2" className={inputClass} />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input id="city" name="city" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              State
            </label>
            <input id="state" name="state" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClass}>
              ZIP / postal code
            </label>
            <input id="postalCode" name="postalCode" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>
              Country
            </label>
            <input id="country" name="country" defaultValue="US" className={inputClass} />
          </div>
        </div>
      </div>

      <div className="border-b border-border pb-8">
        <h2 className="text-sm font-medium">About the piece</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="brand" className={labelClass}>
              Brand
            </label>
            <input id="brand" name="brand" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="productName" className={labelClass}>
              Product name
            </label>
            <input
              id="productName"
              name="productName"
              required
              placeholder="e.g. Neverfull MM"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="condition" className={labelClass}>
              Condition
            </label>
            <select id="condition" name="condition" defaultValue="excellent" className={inputClass}>
              {PRODUCT_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="yearOfPurchase" className={labelClass}>
              Year of purchase <span className="text-muted-foreground">(optional)</span>
            </label>
            <input id="yearOfPurchase" name="yearOfPurchase" placeholder="e.g. 2021" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="size" className={labelClass}>
              Size <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="size"
              name="size"
              placeholder='e.g. W 23.5 cm x H 17 cm x D 11.5 cm'
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClass}>
              Anything else we should know?
            </label>
            <textarea id="notes" name="notes" rows={4} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="border-b border-border pb-8">
        <h2 className="text-sm font-medium">Photos</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Please include at least {SELL_SUBMISSION_MIN_PHOTOS} photos: the
          front, back, interior, hardware, base/corners, and any flaws or
          wear.
        </p>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          required
          className="mt-3 w-full text-sm"
        />
      </div>

      <div>
        <h2 className="text-sm font-medium">
          Proof of authenticity <span className="text-muted-foreground">(optional)</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A receipt, dust bag card, or prior authentication certificate, if
          you have one.
        </p>
        <input
          id="proofOfAuthenticity"
          name="proofOfAuthenticity"
          type="file"
          accept="image/*,application/pdf"
          className="mt-3 w-full text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
