import type { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import Providers from "./components/Providers"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Finanzas - Gestión Personal",
  description: "Aplicación de finanzas personales para rastrear ingresos y gastos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={ibmPlexSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
