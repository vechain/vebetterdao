"use client"

import { ClientOnly, Button, Skeleton, Span, IconButtonProps, SpanProps } from "@chakra-ui/react"
import { ThemeProvider, useTheme, ThemeProviderProps } from "next-themes"
import * as React from "react"
import { FaMoon, FaSun } from "react-icons/fa"

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
}

export type ColorMode = "light" | "dark"

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const colorMode = forcedTheme || resolvedTheme
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }
  return {
    colorMode: colorMode as ColorMode,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? dark : light
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === "light" ? <FaMoon /> : <FaSun />
}

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {
  withText?: boolean
}

export const ColorModeButton = React.forwardRef<HTMLButtonElement, ColorModeButtonProps>(function ColorModeButton(
  { withText, ...props },
  ref,
) {
  const { toggleColorMode, colorMode } = useColorMode()
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <Button
        onClick={toggleColorMode}
        variant="ghost"
        alignItems="center"
        aria-label="Toggle color mode"
        size="sm"
        fontWeight="bold"
        textStyle="lg"
        ref={ref}
        {...props}
        css={{
          _icon: {
            width: "4",
            height: "4",
          },
        }}>
        <ColorModeIcon />
        {withText && (colorMode === "dark" ? "Light" : "Dark")}
      </Button>
    </ClientOnly>
  )
})

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(function LightMode(props, ref) {
  return <Span color="fg" display="contents" className="chakra-theme light" colorPalette="light" ref={ref} {...props} />
})

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(function DarkMode(props, ref) {
  return <Span color="fg" display="contents" className="chakra-theme dark" colorPalette="dark" ref={ref} {...props} />
})
