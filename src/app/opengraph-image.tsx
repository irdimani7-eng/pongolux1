import { ImageResponse } from "next/og";

// Default Open Graph / Twitter share image for the whole site — any page
// that doesn't define its own opengraph-image/twitter-image (e.g. the
// per-product one on /product/[sku]) falls back to this. Built with
// ImageResponse rather than a static file so it doesn't depend on a real
// photoshoot being available yet, and stays in sync with the brand palette
// automatically. See node_modules/next/dist/docs/.../opengraph-image.md.
export const alt = "PongoLux — Authenticated Designer Handbags";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <path
              d="M11 14C11 8.477 13.239 4 16 4C18.761 4 21 8.477 21 14"
              stroke="#a3814f"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="6" y="13" width="20" height="15" rx="3" fill="#a3814f" />
            <rect x="13.5" y="17" width="5" height="3.2" rx="1" fill="#faf8f5" />
          </svg>
          <div
            style={{
              fontSize: 88,
              color: "#1c1917",
              letterSpacing: 1,
            }}
          >
            PongoLux
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#57534e",
          }}
        >
          Authenticated Designer Handbags
        </div>
      </div>
    ),
    { ...size }
  );
}
