import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import localFont from "next/font/local"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"
import "./globals.css"
import Providers from "@/components/providers/Providers"

// Fonts are served from the repo (latin subset, SIL OFL 1.1 — see src/app/fonts/) instead of
// next/font/google, so `next build` no longer downloads them from Google Fonts: a failed
// download there broke CI once. `variable` exposes the family to the MUI theme.
const ibmPlexSans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

const jetBrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
}

export const metadata: Metadata = {
  title: { default: "Finanzas", template: "%s | Finanzas" },
  description: "Aplicación de finanzas personales para rastrear ingresos y gastos",
  icons: { icon: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Finanzas", statusBarStyle: "default" },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Reading headers() opts every route into dynamic rendering so Next can stamp the
  // per-request CSP nonce (set in src/proxy.ts) onto its <script> tags. Static prerender
  // would ship nonce-less scripts that 'strict-dynamic' then blocks.
  // The same nonce goes to emotion, which stamps it on every <style> it writes (SSR and
  // client), as the CSP's style-src-elem requires.
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${ibmPlexSans.className} ${ibmPlexSans.variable} ${jetBrainsMono.variable}`}>
        {/* Emotion styles go into <head> during SSR. Without this provider emotion writes a
            <style> next to every component in <body>; any of those still there when React
            hydrates (HTML streamed after emotion loaded) is an extra node → React #418. */}
        <AppRouterCacheProvider options={{ key: "mui", nonce }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
