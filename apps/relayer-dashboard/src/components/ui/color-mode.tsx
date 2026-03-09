"use client"

import {
  Button,
  ClientOnly,
  Icon,
  Skeleton,
  Switch,
  type IconButtonProps,
  type SwitchRootProps,
} from "@chakra-ui/react"
import { ThemeProvider, useTheme, type ThemeProviderProps } from "next-themes"
import * as React from "react"
import { FaMoon, FaSun } from "react-icons/fa"

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

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? dark : light
}

function ColorModeIcon() {
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

interface ColorModeToggleProps extends Omit<SwitchRootProps, "checked" | "onCheckedChange"> {}

export function ColorModeToggle(props: ColorModeToggleProps) {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <ClientOnly fallback={<Skeleton w="60px" h="32px" borderRadius="full" />}>
      <Switch.Root
        checked={colorMode === "dark"}
        onCheckedChange={toggleColorMode}
        colorPalette="blue"
        size="lg"
        css={{
          "& .chakra-switch__control": {
            w: "60px",
            h: "32px",
            p: "2px",
          },
          "& .chakra-switch__thumb": {
            w: "28px",
            h: "28px",
          },
        }}
        {...props}>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb>
            <Switch.ThumbIndicator fallback={<Icon as={FaSun} color="orange.400" boxSize="5" />}>
              <Icon as={FaMoon} color="blue.300" boxSize="5" />
            </Switch.ThumbIndicator>
          </Switch.Thumb>
        </Switch.Control>
      </Switch.Root>
    </ClientOnly>
  )
}
