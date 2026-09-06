import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type HeroBannerProps = {
  imageSrc: string;
  imageAlt: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  /** "large" for the homepage hero, "compact" for section/category banners. */
  size?: "large" | "compact";
};

/**
 * Full-bleed editorial image banner with a dark gradient scrim behind the
 * text so headline copy stays readable over any photo. Used for the
 * homepage hero and page-top banners (e.g. /shop) — see
 * src/lib/marketing-images.ts for the photography.
 */
export function HeroBanner({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  size = "large",
}: HeroBannerProps) {
  const heightClass = size === "large" ? "h-[560px] sm:h-[640px]" : "h-[320px] sm:h-[380px]";

  return (
    <section className={`relative w-full overflow-hidden ${heightClass}`}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={size === "large"}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-start justify-end px-6 pb-14 sm:pb-16">
        {eyebrow && (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-xl font-(family-name:--font-display) text-3xl leading-tight text-white sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-lg text-sm text-white/85 sm:text-base">
            {subtitle}
          </p>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="rounded-full border border-white/70 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
