"use client"

import { createContext, useContext, useState } from "react"

import type { NavPage } from "@/components/Navbar"

interface NavigationContextValue {
  activePage: NavPage
  setActivePage: (page: NavPage) => void
}

const NavigationContext = createContext<NavigationContextValue>({
  activePage: "home",
  setActivePage: () => {},
})

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState<NavPage>("home")

  return <NavigationContext.Provider value={{ activePage, setActivePage }}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  return useContext(NavigationContext)
}
