import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product-card";
import { HeroBanner } from "@/components/hero-banner";
import { listProducts } from "@/lib/products";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { ShieldCheck, Truck, Undo2 } from "lucide-react";

export default async function HomePage() {
  const featured = (await listProducts()).slice(0, 4);

  return (
    <div>
      <HeroBanner
        imageSrc={MARKETING_IMAGES.homeHero.src}
        imageAlt={MARKETING_IMAGES.homeHero.alt}
        eyebrow="PongoLux"
        title={
          <>
            Designer handbags,
            <br />
            verified authentic.
          </>
        }
        subtitle="A US-based reseller of pre-loved designer handbags. Every single piece is independently authenticated before it's listed — no exceptions."
        primaryCta={{ href: "/shop", label: "Shop the collection" }}
        secondaryCta={{ href: "/#authentication", label: "How authentication works" }}
      />

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 shrink-0" strokeWidth={1.5} />
            <span>Every item independently authenticated</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="size-5 shrink-0" strokeWidth={1.5} />
            <span>Free shipping, optional $20 insurance</span>
          </div>
          <div className="flex items-center gap-3">
            <Undo2 className="size-5 shrink-0" strokeWidth={1.5} />
            <span>Returns within 3 days</span>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-(family-name:--font-display) text-2xl">
              Newly listed
            </h2>
            <Link href="/shop" className="text-sm hover:text-accent">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section
        id="authentication"
        className="scroll-mt-20 border-t border-border bg-muted/40"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg lg:order-2">
            <Image
              src={MARKETING_IMAGES.authenticationDetail.src}
              alt={MARKETING_IMAGES.authenticationDetail.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:order-1">
            <h2 className="font-(family-name:--font-display) text-2xl">
              Our authentication process
            </h2>
            <div className="mt-6 space-y-8 text-sm">
              <div>
                <div className="text-2xl font-(family-name:--font-display)">
                  01
                </div>
                <p className="mt-2 text-muted-foreground">
                  Every bag is scanned with Entrupy, whose AI-powered
                  technology checks material and manufacturing signatures
                  against millions of verified reference points.
                </p>
              </div>
              <div>
                <div className="text-2xl font-(family-name:--font-display)">
                  02
                </div>
                <p className="mt-2 text-muted-foreground">
                  Our in-house authentication team then performs a hands-on
                  review — hardware, stitching, materials, and date codes —
                  before anything is listed.
                </p>
              </div>
              <div>
                <div className="text-2xl font-(family-name:--font-display)">
                  03
                </div>
                <p className="mt-2 text-muted-foreground">
                  If an item ever fails re-authentication, we refund it in
                  full — that guarantee is the foundation of PongoLux.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
