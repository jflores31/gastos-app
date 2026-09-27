import type { MetadataRoute } from "next"

// Web app manifest (/manifest.webmanifest): makes the app installable ("Install app" /
// "Add to Home Screen"). No service worker on purpose — see docs/DEPLOYMENT.md → "Solución
// de problemas" (a stale cache after a deploy was the problem, not the lack of one).
// Icons: public/icons/, generated from favicon.svg by scripts/generate-icons.mjs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas — Gestión Personal",
    short_name: "Finanzas",
    description: "Ingresos, gastos, presupuestos y metas en un solo lugar.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366F1",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
