"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "../lib/supabase"

const UserContext = createContext<User | null | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === "SIGNED_IN") {
        sessionStorage.setItem("gastos_session_alive", "1")
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useSupabaseUser() {
  return useContext(UserContext)
}
