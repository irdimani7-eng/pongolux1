import Image from "next/image";
import Link from "next/link";
import { EntrupyBadge } from "@/components/entrupy-badge";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { ShieldCheck, ScanLine, Users, RotateCcw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authenticity",
  description:
    "How PongoLux verifies every handbag with Entrupy and an in-house expert review before it's ever listed.",
};

const STEPS = [
  {
    icon: ScanLine,
    title: "Entrupy scan",
    body: "Every bag is scanned with Entrupy's handheld device, whose AI-powered technology checks material and manufacturing signatures against a reference database built from millions of verified items.",
  },
  {
    icon: Users,
    title: "In-house expert review",
    body: "Our own authentication team then performs a hands-on inspection — hardware, stitching, materials, and date codes — before anything is approved for listing.",
  },
  {
    icon: ShieldCheck,
    title: "A certificate, per item",
    body: "Entrupy-authenticated pieces get their own certificate, hosted permanently at cert.entrupy.com — never a static image we could edit, always Entrupy's own live record. Find the link on that item's product page.",
  },
  {
    icon: RotateCcw,
    title: "Our guarantee",
    body: "If an item ever fails re-authentication, we refund it in full. That guarantee is the foundation PongoLux is built on.",
  },
];

export default function AuthenticityPage() {
  return (
    <div>
      <div className="relative h-[280px] w-full overflow-hidden sm:h-[340px]">
        <Image
          src={MARKETING_IMAGES.authenticationDetail.src}
          alt={MARKETING_IMAGES.authenticationDetail.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-start justify-end px-6 pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
            PongoLux
          </p>
          <h1 className="mt-2 font-(family-name:--font-display) text-3xl text-white sm:text-4xl">
            Authenticity, guaranteed
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every single piece we sell is 100% authentic — no exceptions. We
          combine Entrupy&apos;s AI-powered authentication technology with a
          hands-on review by our own team, and back it with a full refund
          guarantee. Here&apos;s exactly how it works.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-muted/40 p-6 sm:p-8">
          <EntrupyBadge variant="full" />
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                <Icon className="size-5 text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-medium">{title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-border p-6 text-sm text-muted-foreground sm:p-8">
          <p>
            Every product page for an Entrupy-authenticated item links
            directly to that piece&apos;s own certificate at{" "}
            <span className="text-foreground">cert.entrupy.com</span> — the
            only place a genuine Entrupy certificate lives. Entrupy&apos;s
            own guidance is not to trust a certificate presented any other
            way, and we agree, which is why we never post static certificate
            images here.
          </p>
          <p className="mt-4">
            Questions about a specific piece?{" "}
            <Link href="/contact" className="font-medium text-foreground underline hover:text-accent">
              Get in touch
            </Link>{" "}
            — we&apos;re glad to walk through it.
          </p>
        </div>
      </div>
    </div>
  );
}
