// Lucide (the icon set used elsewhere in this app — see lucide-react
// imports) deliberately excludes brand/logo icons for licensing reasons, so
// Instagram gets a small hand-drawn SVG here instead, styled to match
// lucide's stroke-based look (24x24 viewBox, currentColor, strokeWidth 1.5)
// so it sits visually consistent with the rest of the site's icons. WhatsApp
// just reuses lucide's generic MessageCircle rather than a bespoke logo mark.

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
