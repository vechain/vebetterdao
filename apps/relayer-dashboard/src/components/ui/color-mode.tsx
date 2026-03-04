"use client"

import { ThemeProvider, useTheme, type ThemeProviderProps } from "next-themes"
import * as React from "react"

export type ColorMode = "light" | "dark"

export type ColorModeProviderProps = ThemeProviderProps

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export function ColorModeProvider(props: ThemeProviderProps) {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const colorMode = forcedTheme ?? resolvedTheme
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }
  return {
    colorMode: (colorMode ?? "light") as ColorMode,
    setColorMode: setTheme,
    toggleColorMode,
  }
}
