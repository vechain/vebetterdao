"use client"
import { ChakraProvider } from "@chakra-ui/react"

import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"

import theme from "@/app/theme/theme"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={theme}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
