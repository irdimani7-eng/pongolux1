import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { HeroBanner } from "@/components/hero-banner";
import { listProducts } from "@/lib/products";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

export const metadata = {
  title: "New Price Drops",
  description:
    "Authenticated designer handbags with a new, lower price — shop markdowns on Chanel, Louis Vuitton, Gucci, and more at PongoLux.",
};

export default async function PriceDropsPage() {
  const products = await listProducts({ onSaleOnly: true });

  return (
    <div>
      <HeroBanner
        imageSrc={MARKETING_IMAGES.priceDropsBanner.src}
        imageAlt={MARKETING_IMAGES.priceDropsBanner.alt}
        eyebrow="Limited time"
        title="New price drops"
        subtitle="Recently marked-down pieces — once the price drops on a one-of-one, it won't last long."
        size="compact"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {products.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">
            Nothing&apos;s marked down right now — check back soon, or{" "}
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
