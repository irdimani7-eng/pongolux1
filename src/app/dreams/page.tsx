import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DreamForm } from "@/components/dream-form";
import { Sparkles, Search, PhoneCall, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Bag of Dreams",
  description:
    "Tell PongoLux about the designer handbag you're searching for and we'll check our vendor network for a match.",
};

export default async function DreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dreams");
  }
  const { submitted } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Sparkles className="size-4 text-accent" strokeWidth={1.5} />
        A little something special
      </div>
      <h1 className="mt-2 font-(family-name:--font-display) text-3xl">
        Tell us about your bag of dreams
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Every collector has one — the piece that got away, the color that
        was discontinued, the style you&apos;ve quietly hoped would resurface.
        Describe it, and we&apos;ll go looking on your behalf across our
        network of trusted vendors.
      </p>

      <div className="mt-8 grid gap-4 rounded-lg border border-border bg-muted/40 p-6 sm:grid-cols-3">
        <div className="text-center sm:text-left">
          <Sparkles className="mx-auto size-5 text-accent sm:mx-0" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium">1. Dream it up</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tell us the brand, style, and any details that matter to you.
          </p>
        </div>
        <div className="text-center sm:text-left">
          <Search className="mx-auto size-5 text-accent sm:mx-0" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium">2. We search</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            We check your request against our vendor network, quietly and
            without obligation.
          </p>
        </div>
        <div className="text-center sm:text-left">
          <PhoneCall className="mx-auto size-5 text-accent sm:mx-0" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium">3. We reach out</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Find a match and we&apos;ll call or email you directly to talk
            it through.
          </p>
        </div>
      </div>

      {submitted === "1" ? (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-surface p-6">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Your dream is officially on our radar.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll be in touch the moment our search turns up a match.
              You can check in any time from{" "}
              <a href="/account#dream-inquiries" className="underline hover:text-accent">
                your account
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <DreamForm />
      )}
    </div>
  );
}
