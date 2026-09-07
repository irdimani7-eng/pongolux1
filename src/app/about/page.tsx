import Image from "next/image";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-(family-name:--font-display) text-4xl">
          Our story
        </h1>
        <p className="mt-6 text-muted-foreground">
          PongoLux is a Chicago-based reseller of pre-loved designer
          handbags — every single piece independently authenticated before
          it&apos;s ever listed. We started PongoLux because we believe
          owning a beautiful, well-made bag shouldn&apos;t require paying
          full retail, and it should never come with a shred of doubt about
          whether it&apos;s real.
        </p>
        {/*
          TODO(Irdi): Replace the paragraph above with your real founding
          story — why you started PongoLux, what got you into authenticating
          and reselling handbags, a specific moment or experience that
          shaped it. That personal detail is what turns this from a generic
          "about us" blurb into something visitors actually connect with.
          Send it over whenever you're ready and this page gets updated.
        */}
      </div>

      <div className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src={MARKETING_IMAGES.authenticationDetail.src}
              alt={MARKETING_IMAGES.authenticationDetail.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-(family-name:--font-display) text-2xl">
              Authenticity, non-negotiable
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Every bag that comes through PongoLux is scanned with Entrupy
              and then hand-reviewed by our in-house authentication team —
              hardware, stitching, materials, and date codes, all checked
              before anything is listed for sale.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              If an item ever fails re-authentication, we refund it in full.
              That guarantee is the foundation PongoLux is built on, and
              it&apos;s the same reason we only ever sell one of each piece —
              no reproductions, no drop-shipping, no exceptions.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-(family-name:--font-display) text-2xl">
          Based in Chicago, shipping nationwide
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          We&apos;re a small, US-based team — every order ships within 3
          business days, and every question gets a real reply from someone
          who actually knows the bags.
        </p>
      </div>
    </div>
  );
}
