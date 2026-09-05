import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { listProducts } from "@/lib/products";
import { ShieldCheck, Truck, Undo2 } from "lucide-react";

export default async function HomePage() {
  const featured = (await listProducts()).slice(0, 4);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="font-(family-name:--font-display) text-4xl leading-tight sm:text-5xl">
          Designer handbags,
          <br />
          verified authentic.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          PongoLux is a US-based reseller of pre-loved designer handbags.
          Every single piece is independently authenticated before it&apos;s
          listed — no exceptions.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Shop the collection
          </Link>
          <Link
            href="#authentication"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            How authentication works
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 shrink-0" strokeWidth={1.5} />
            <span>Every item independently authenticated</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="size-5 shrink-0" strokeWidth={1.5} />
            <span>Insured shipping across the US</span>
          </div>
          <div className="flex items-center gap-3">
            <Undo2 className="size-5 shrink-0" strokeWidth={1.5} />
            <span>Easy returns within 7 days</span>
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
        className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16"
      >
        <h2 className="font-(family-name:--font-display) text-2xl">
          Our authentication process
        </h2>
        <div className="mt-6 grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <div className="text-2xl font-(family-name:--font-display)">
              01
            </div>
            <p className="mt-2 text-muted-foreground">
              Every handbag is inspected in person against brand-specific
              hardware, stitching, materials, and date-code markers.
            </p>
          </div>
          <div>
            <div className="text-2xl font-(family-name:--font-display)">
              02
            </div>
            <p className="mt-2 text-muted-foreground">
              A written authentication record is created and attached to the
              listing, naming the method and expert or service used.
            </p>
          </div>
          <div>
            <div className="text-2xl font-(family-name:--font-display)">
              03
            </div>
            <p className="mt-2 text-muted-foreground">
              If an item ever fails a re-authentication, we refund it in
              full — that guarantee is the foundation of PongoLux.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
