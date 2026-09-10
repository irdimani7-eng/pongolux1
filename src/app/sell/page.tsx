import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SellForm } from "@/components/sell-form";
import { CheckCircle2, Gem, Mail, Wallet } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell Your Bag to Us",
  description:
    "Submit a designer handbag for a Buy Now offer or consignment with PongoLux.",
};

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/sell");
  }
  const { submitted } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Sell your bag to us
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Tell us about the piece and we&apos;ll take it from there. Every
        submission is reviewed personally — no automated lowball offers.
      </p>

      <div className="mt-8 grid gap-4 rounded-lg border border-border bg-muted/40 p-6 sm:grid-cols-3">
        <div className="text-center sm:text-left">
          <Mail className="mx-auto size-5 text-accent sm:mx-0" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium">1. Submit</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Share the details and at least 6 photos of your bag.
          </p>
        </div>
        <div className="text-center sm:text-left">
          <Gem className="mx-auto size-5 text-accent sm:mx-0" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium">2. We review</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            If we&apos;re interested, you&apos;ll get a quote for either Buy
            Now or Consign.
          </p>
        </div>
        <div className="text-center sm:text-left">
          <Wallet className="mx-auto size-5 text-accent sm:mx-0" strokeWidth={1.5} />
          <h3 className="mt-2 text-sm font-medium">3. Get paid</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Buy Now pays promptly once you accept. Consignment pays 7–10
            days after your piece sells.
          </p>
        </div>
      </div>

      {submitted === "1" ? (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-surface p-6">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Thanks — we&apos;ve got it.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll review your submission and follow up by email. You
              can track its status any time from{" "}
              <a href="/account#sell-submissions" className="underline hover:text-accent">
                your account
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <SellForm
          initialName={session.user.name ?? undefined}
          initialEmail={session.user.email ?? undefined}
        />
      )}
    </div>
  );
}
