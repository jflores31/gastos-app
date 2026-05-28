import type { Metadata, Viewport } from "next"
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${ibmPlexSans.className} ${jetBrainsMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
