"use client"

import { SettingsProvider } from "@/contexts/SettingsContext"
import { DataProvider } from "@/contexts/DataContext"
import { UserProvider } from "@/contexts/UserContext"
import DynamicThemeProvider from "./DynamicThemeProvider"
import ErrorReporter from "./ErrorReporter"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ErrorReporter />
      <SettingsProvider>
        <DataProvider>
          <DynamicThemeProvider>
            {children}
          </DynamicThemeProvider>
        </DataProvider>
      </SettingsProvider>
    </UserProvider>
  )
}
