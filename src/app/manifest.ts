import type { MetadataRoute } from "next";

// Lets mobile visitors "Add to Home Screen" with a real name/icon instead
// of a bare bookmark. Uses the existing icon.svg mark rather than a new
// PNG asset — Chrome/Android accept an SVG icon with sizes: "any"; iOS
// Safari's home-screen icon support is pickier about SVG, so this is a
// reasonable free upgrade now and worth revisiting with real exported PNG
// icons (192x192, 512x512) once real brand assets exist.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PongoLux — Authenticated Designer Handbags",
    short_name: "PongoLux",
    description:
      "PongoLux is a US-based reseller of 100% authenticated designer handbags.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#faf8f5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
