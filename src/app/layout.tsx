import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Providers from "./components/Providers"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Reading headers() opts every route into dynamic rendering so Next can stamp the
  // per-request CSP nonce (set in src/proxy.ts) onto its <script> tags. Static prerender
  // would ship nonce-less scripts that 'strict-dynamic' then blocks.
  await headers()

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${ibmPlexSans.className} ${jetBrainsMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
