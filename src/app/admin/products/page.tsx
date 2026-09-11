import Link from "next/link";
import Image from "next/image";
import { listProductsForAdmin } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import { setProductStatusAction } from "@/lib/actions/admin-products";

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-muted text-muted-foreground",
  archived: "bg-red-100 text-red-800",
};

export default async function AdminProductsPage() {
  const products = await listProductsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-(family-name:--font-display) text-3xl">
          Products
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/bulk"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Bulk import
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            + New listing
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-normal">Photo</th>
              <th className="py-2 pr-4 font-normal">SKU</th>
              <th className="py-2 pr-4 font-normal">Title</th>
              <th className="py-2 pr-4 font-normal">Price</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 pr-4 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="py-3 pr-4">
                  <div className="relative size-12 overflow-hidden rounded bg-muted">
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="hover:text-accent"
                  >
                    {p.brand} {p.title}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  {formatPrice(p.priceCents, p.currency)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs capitalize ${STATUS_STYLES[p.status] ?? ""}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-xs hover:text-accent"
                    >
                      Edit
                    </Link>
                    {p.status !== "archived" ? (
                      <form
                        action={setProductStatusAction.bind(
                          null,
                          p.id,
                          "archived"
                        )}
                      >
                        <button
                          type="submit"
                          className="text-xs text-danger hover:underline"
                        >
                          Archive
                        </button>
                      </form>
                    ) : (
                      <form
                        action={setProductStatusAction.bind(
                          null,
                          p.id,
                          "available"
                        )}
                      >
                        <button
                          type="submit"
                          className="text-xs hover:underline"
                        >
                          Unarchive
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">
            No listings yet.
          </p>
        )}
      </div>
    </div>
  );
}
