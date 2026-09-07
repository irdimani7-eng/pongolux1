"use client";

import { useActionState } from "react";
import { subscribeToNewsletterAction } from "@/lib/actions/newsletter";

export function NewsletterSignupForm() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletterAction,
    null
  );

  if (state?.success) {
    return (
      <p className="text-sm text-muted-foreground">
        You&apos;re on the list — thanks for signing up.
      </p>
    );
  }

  return (
    <div className="max-w-xs">
      <form action={formAction} className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="Your email"
          aria-label="Email address"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "Join"}
        </button>
      </form>
      {state?.error && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
    </div>
  );
}
