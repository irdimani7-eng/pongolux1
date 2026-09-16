import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Plain server-rendered pagination for /shop — every link is a real <a
 * href>, so page 2+ is crawlable by Google (a client-only "Load more"
 * button would hide the rest of the catalog from search entirely, which
 * defeats the point of adding pagination for SEO in the first place).
 *
 * `buildHref` takes a 1-indexed page number and returns the full URL,
 * including whatever filters/search/sort params are already active — the
 * caller owns that so this component stays filter-agnostic.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  // Keep the page-number row short even with many pages: current page,
  // one neighbor on each side, and the first/last page, with "…" gaps.
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const shown = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav
      aria-label="Shop pagination"
      className="mt-12 flex items-center justify-center gap-1.5 text-sm"
    >
      <PageLink
        href={page > 1 ? buildHref(page - 1) : undefined}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
      </PageLink>

      {shown.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - shown[i - 1] > 1 && (
            <span className="px-1 text-muted-foreground">…</span>
          )}
          <PageLink href={buildHref(p)} current={p === page}>
            {p}
          </PageLink>
        </span>
      ))}

      <PageLink
        href={page < totalPages ? buildHref(page + 1) : undefined}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  current,
  children,
  ...rest
}: {
  href?: string;
  current?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const base =
    "flex size-9 items-center justify-center rounded-full border text-sm transition-colors";
  if (!href) {
    return (
      <span className={`${base} border-border text-muted-foreground/40`} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} ${
        current
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:bg-muted"
      }`}
      {...rest}
    >
      {children}
    </Link>
  );
}
