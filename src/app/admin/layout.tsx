import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/admin"
            className="font-(family-name:--font-display) text-lg"
          >
            PongoLux Admin
          </Link>
          <Link href="/admin/products" className="hover:text-accent">
            Products
          </Link>
          <Link href="/admin/orders" className="hover:text-accent">
            Orders
          </Link>
        </nav>
        <Link href="/" className="text-sm text-muted-foreground hover:text-accent">
          Back to site
        </Link>
      </div>
      <div className="py-8">{children}</div>
    </div>
  );
}
