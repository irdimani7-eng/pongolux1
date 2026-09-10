import Image from "next/image";
import { ExternalLink } from "lucide-react";

/**
 * Entrupy trust marks — the general "Verified by Entrupy" badge/logo can
 * be used anywhere as a general trust signal (homepage, cart, footer).
 * These are Entrupy's own brand assets (delivered directly to Irdi),
 * stored locally at public/entrupy/ rather than hot-linked, so they load
 * reliably regardless of Entrupy's own site.
 *
 * This is deliberately separate from EntrupyCertificateLink below, which
 * links out to one specific item's own live certificate — never a static
 * image of a certificate, per Entrupy's own guidance that only
 * entrupy.com-hosted certificates should be trusted.
 */

type EntrupyBadgeProps = {
  /** "mark" = just the small badge image, for tight spaces (trust bar,
   * cart line item). "full" = badge + a line of supporting copy, for
   * places with room to explain what it means (homepage, /authenticity). */
  variant?: "mark" | "full";
  className?: string;
};

export function EntrupyBadge({ variant = "mark", className = "" }: EntrupyBadgeProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/entrupy/verified-badge.webp"
        alt="Verified by Entrupy"
        width={112}
        height={112}
        className={`h-14 w-14 ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Image
        src="/entrupy/verified-badge.webp"
        alt="Verified by Entrupy"
        width={112}
        height={112}
        className="h-16 w-16 shrink-0"
      />
      <p className="text-sm text-muted-foreground">
        Every piece is scanned and verified using{" "}
        <a
          href="https://www.entrupy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline hover:text-accent"
        >
          Entrupy
        </a>
        &apos;s AI-powered authentication technology before it ever reaches
        our in-house review.
      </p>
    </div>
  );
}

/** Links out to one specific item's own live certificate at
 * cert.entrupy.com/<id> — set per-listing in the admin dashboard
 * (authenticationRecords.certificateUrl). Renders nothing when a listing
 * doesn't have one yet. */
export function EntrupyCertificateLink({
  url,
  className = "",
}: {
  url: string | null | undefined;
  className?: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline ${className}`}
    >
      View this item&apos;s Entrupy certificate
      <ExternalLink className="size-3.5" strokeWidth={2} />
    </a>
  );
}
