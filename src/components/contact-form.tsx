"use client";

import { useActionState } from "react";
import { CONTACT_ATTENTION_OPTIONS } from "@/lib/validations";
import { submitContactForm } from "@/lib/actions/contact";

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, null);

  if (state?.success) {
    return (
      <div className="rounded-md border border-border bg-surface p-6">
        <p className="font-medium">Message sent.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Thanks for reaching out — we typically reply within one business
          day.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="attention" className={labelClass}>
          Attention
        </label>
        <select
          id="attention"
          name="attention"
          defaultValue={CONTACT_ATTENTION_OPTIONS[0]}
          className={inputClass}
        >
          {CONTACT_ATTENTION_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={inputClass}
        />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
