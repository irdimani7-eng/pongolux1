/**
 * PongoLux logo — an original mark Claude designed (no brand assets were
 * available yet). A simple geometric handbag silhouette paired with a
 * serif wordmark, built as inline SVG so it needs no image request, scales
 * perfectly, and can recolor for light/dark surfaces via `variant`.
 *
 * Replace this component (and `src/app/icon.svg`, which reuses the mark
 * below) once real branding is ready — nothing else in the app references
 * a logo file directly, so swapping this one file is enough.
 */
type LogoProps = {
  variant?: "auto" | "light" | "dark";
  iconOnly?: boolean;
  className?: string;
};

export function Logo({ variant = "auto", iconOnly = false, className }: LogoProps) {
  // "auto" relies on currentColor + Tailwind's text color utilities so the
  // mark follows the surrounding theme; "light"/"dark" hard-code a color for
  // places (like an email or a fixed dark footer band) where that isn't true.
  const color =
    variant === "light" ? "#faf8f5" : variant === "dark" ? "#1c1917" : "currentColor";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M11 14C11 8.477 13.239 4 16 4C18.761 4 21 8.477 21 14"
          stroke="#a3814f"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="6" y="13" width="20" height="15" rx="3" fill="#a3814f" />
        <rect x="13.5" y="17" width="5" height="3.2" rx="1" fill={color} />
      </svg>
      {!iconOnly && (
        <span
          className="font-(family-name:--font-display) text-xl tracking-wide"
          style={{ color }}
        >
          PongoLux
        </span>
      )}
    </span>
  );
}
