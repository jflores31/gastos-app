"use client"

import { SettingsProvider } from "../../context/SettingsContext.jsx"
import { DataProvider } from "../../context/DataContext.jsx"
import { UserProvider } from "../../context/UserContext"
import DynamicThemeProvider from "./DynamicThemeProvider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
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
