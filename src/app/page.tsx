import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product-card";
import { HeroBanner } from "@/components/hero-banner";
import { listProducts, getFilterOptions } from "@/lib/products";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { BRAND_STORIES } from "@/lib/brand-stories";
import { Sparkles, Leaf } from "lucide-react";
import { TrustBar } from "@/components/trust-bar";
import { BrandMarquee } from "@/components/brand-marquee";

export default async function HomePage() {
  const [allAvailable, mostWanted, { brands }] = await Promise.all([
    listProducts({ excludeSold: true }),
    listProducts({ excludeSold: true, mostWantedOnly: true }),
    getFilterOptions(),
  ]);
  const featured = allAvailable.slice(0, 8);
  const mostWantedPreview = mostWanted.slice(0, 4);

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

      <TrustBar />

      {brands.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-6 font-(family-name:--font-display) text-2xl">
              Shop by brand
            </h2>
          </div>
          <BrandMarquee brands={brands} />
        </section>
      )}

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

      {mostWantedPreview.length > 0 && (
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="text-sm uppercase tracking-wide text-muted-foreground">
                  Fan favorites
                </div>
                <h2 className="mt-1 font-(family-name:--font-display) text-2xl">
                  Most wanted
                </h2>
              </div>
              <Link href="/shop/most-wanted" className="text-sm hover:text-accent">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {mostWantedPreview.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-8">
            <Leaf className="size-6" strokeWidth={1.5} />
            <h3 className="mt-4 font-(family-name:--font-display) text-xl">
              Why buy pre-loved
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              A well-made handbag is built to outlast trends by decades — buying
              it secondhand means the leather, hardware, and craftsmanship get
              a second life instead of sitting unused. It&apos;s a lower-impact way
              to own the same pieces, often for a fraction of the original
              retail price.
            </p>
          </div>
          <div className="rounded-lg border border-border p-8">
            <Sparkles className="size-6" strokeWidth={1.5} />
            <h3 className="mt-4 font-(family-name:--font-display) text-xl">
              Consignment, made simple
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Have a designer bag you&apos;re ready to let go of? We handle the
              authentication, photography, and listing — you get paid once it
              sells. No upfront fees.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm underline hover:text-accent"
            >
              Get in touch about consigning
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-(family-name:--font-display) text-2xl">
            The story behind the bags
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A little of the history behind the maisons whose work passes
            through our hands.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BRAND_STORIES.map((story) => (
              <div key={story.brand}>
                <h3 className="font-(family-name:--font-display) text-lg">
                  {story.brand}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {story.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
