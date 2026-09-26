"use client"

import { SettingsProvider } from "../../context/SettingsContext"
import { DataProvider } from "../../context/DataContext.jsx"
import { UserProvider } from "../../context/UserContext"
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
