"use client";

import { useActionState } from "react";
import { CONTACT_PREFERENCES } from "@/lib/validations";
import { CONTACT_PREFERENCE_LABELS } from "@/lib/format";
import { submitDreamInquiryAction } from "@/lib/actions/dreams";

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

export function DreamForm() {
  const [state, formAction, pending] = useActionState(
    submitDreamInquiryAction,
    null
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="brand" className={labelClass}>
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            required
            placeholder="e.g. Chanel"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="modelOrStyle" className={labelClass}>
            Model or style
          </label>
          <input
            id="modelOrStyle"
            name="modelOrStyle"
            required
            placeholder="e.g. Classic Flap, Medium"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="colorPreference" className={labelClass}>
            Color <span className="text-muted-foreground">(optional)</span>
          </label>
          <input id="colorPreference" name="colorPreference" className={inputClass} />
        </div>
        <div>
          <label htmlFor="sizePreference" className={labelClass}>
            Size <span className="text-muted-foreground">(optional)</span>
          </label>
          <input id="sizePreference" name="sizePreference" className={inputClass} />
        </div>
        <div>
          <label htmlFor="budgetRange" className={labelClass}>
            Budget <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="budgetRange"
            name="budgetRange"
            placeholder="e.g. $3,000–$5,000"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="occasion" className={labelClass}>
            Is there an occasion? <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="occasion"
            name="occasion"
            placeholder="e.g. our anniversary in June"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="details" className={labelClass}>
          Tell us the story <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          placeholder="What draws you to this piece? Any details that would help us recognize the right one when it turns up."
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>How should we reach you?</span>
        <div className="mt-2 flex flex-wrap gap-4">
          {CONTACT_PREFERENCES.map((pref) => (
            <label key={pref} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="contactPreference"
                value={pref}
                defaultChecked={pref === "either"}
                className="size-4"
              />
              {CONTACT_PREFERENCE_LABELS[pref]}
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending…" : "Send our search team your dream"}
      </button>
    </form>
  );
}
