import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { HeroBanner } from "@/components/hero-banner";
import { listProducts } from "@/lib/products";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

export const metadata = {
  title: "Most Wanted",
  description:
    "Our most sought-after authenticated designer handbags, hand-picked by the PongoLux team.",
};

export default async function MostWantedPage() {
  const products = await listProducts({ mostWantedOnly: true });

  return (
    <div>
      <HeroBanner
        imageSrc={MARKETING_IMAGES.mostWantedBanner.src}
        imageAlt={MARKETING_IMAGES.mostWantedBanner.alt}
        eyebrow="Fan favorites"
        title="Most wanted"
        subtitle="The pieces getting the most attention right now — our picks for the bags worth acting on quickly."
        size="compact"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {products.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">
            Nothing&apos;s been flagged as most wanted yet — check back soon,
            or{" "}
            <Link href="/shop" className="text-foreground hover:text-accent">
              browse the full collection
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
