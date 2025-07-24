import { createSystem, defaultConfig } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { darkThemeColors, lightThemeColors } from "./colors"
import "@fontsource-variable/instrument-sans"
import "@fontsource-variable/inter"

const baseThemeConfig = {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `"Instrument Sans Variable", sans-serif` },
        body: { value: `"Inter Variable", sans-serif` },
      },
      colors: {
        green: {
          50: { value: "#f3f9f3" },
          100: { value: "#cfe6d0" },
          200: { value: "#a4d1a6" },
          300: { value: "#6fb672" },
          400: { value: "#51a654" },
          500: { value: "#259029" },
          600: { value: "#007b05" },
          700: { value: "#006304" },
          800: { value: "#005403" },
          900: { value: "#003d02" },
        },
      },
    },
    semanticTokens: {
      colors: {
        "chakra-body-text": {
          value: { base: "#1E1E1E", _dark: "#E4E4E4" },
        },
        "chakra-body-bg": {
          value: { base: "#F7F7F7", _dark: "#131313" },
        },
        "info-bg": {
          value: { base: "#F8F8F8", _dark: "#1E1E1E" },
        },
        "dark-contrast-on-card-bg": {
          value: { base: "#F8F8F8", _dark: "#131313" },
        },
        "profile-bg": {
          value: { base: "#FFFFFF", _dark: "#2D2D2F" },
        },
        "contrast-on-dark-bg": {
          value: { base: "#FFFFFF", _dark: "#1A1A1A" },
        },
        "light-contrast-on-card-bg": {
          value: { base: "#FAFAFA", _dark: "#2D2D2F" },
        },
        "your-ranking-hover": {
          value: { base: "#005EFF", _dark: "#005EFF" },
        },
        "b3tr-balance-bg": {
          value: { base: "#E5EEFF", _dark: "#1A2547" },
        },
        "vot3-balance-bg": {
          value: { base: "#E3FFC4", _dark: "#1A2E0F" },
        },
        "contrast-bg-strong": {
          value: { base: "#000000", _dark: "#E2E8F0" },
        },
        "contrast-bg-muted": {
          value: { base: "#FFFFFF", _dark: "#2D3748" },
        },
        "contrast-bg-muted-hover": {
          value: { base: "#EFEFEF", _dark: "#A0AEC0" },
        },
        "contrast-bg-strong-hover": {
          value: { base: "#1A1A1A", _dark: "#CBD5E0" },
        },
        "contrast-fg-on-strong": {
          value: { base: "#FFFFFF", _dark: "#000000" },
        },
        "contrast-fg-on-muted": {
          value: { base: "#000000", _dark: "#FFFFFF" },
        },
        "hover-contrast-bg": {
          value: { base: "#F8F8F8", _dark: "#2D2F31" },
        },
        "contrast-border": {
          value: { base: "#EFEFEF", _dark: "#4A5568" },
        },
      },
    },
  },
}

export const pulseKeyFrames = (scaledPulse = 1.5) => keyframes`
        0% {
    transform: scale(1, 1);
    opacity: 1;
  }
  100% {
    transform: scale(${scaledPulse} ${scaledPulse});
    opacity: 0;
  }
    `

export const backdropBlurKeyframes = (startingBlur: string = "0px", endingBlur: string = "20px") => keyframes`
    0% {
        backdrop-filter: blur(${startingBlur});
    }
    100% {
        backdrop-filter: blur(${endingBlur});
    }
`

export const backdropBlurAnimation = (startingBlur?: string, endingBlur?: string) =>
  `${backdropBlurKeyframes(startingBlur, endingBlur)} 1s ease-in-out`

export const TooltipBackgroundColor = (isDark = false) => (isDark ? "#CBD5E0" : "#26303E")

export const TooltipTextColor = (isDark = false) => (isDark ? "#171923" : "white")

export const lightTheme = createSystem(defaultConfig, {
  ...baseThemeConfig,
  theme: {
    ...baseThemeConfig.theme,
    tokens: {
      ...baseThemeConfig.theme.tokens,
      colors: {
        ...baseThemeConfig.theme.tokens.colors,
        primary: {
          50: { value: lightThemeColors.primary["50"] },
          100: { value: lightThemeColors.primary["100"] },
          200: { value: lightThemeColors.primary["200"] },
          300: { value: lightThemeColors.primary["300"] },
          400: { value: lightThemeColors.primary["400"] },
          500: { value: lightThemeColors.primary["500"] },
          600: { value: lightThemeColors.primary["600"] },
          700: { value: lightThemeColors.primary["700"] },
          800: { value: lightThemeColors.primary["800"] },
          900: { value: lightThemeColors.primary["900"] },
        },
        secondary: {
          50: { value: lightThemeColors.secondary["50"] },
          100: { value: lightThemeColors.secondary["100"] },
          200: { value: lightThemeColors.secondary["200"] },
          300: { value: lightThemeColors.secondary["300"] },
          400: { value: lightThemeColors.secondary["400"] },
          500: { value: lightThemeColors.secondary["500"] },
          600: { value: lightThemeColors.secondary["600"] },
          700: { value: lightThemeColors.secondary["700"] },
          800: { value: lightThemeColors.secondary["800"] },
          900: { value: lightThemeColors.secondary["900"] },
        },
        tertiary: {
          100: { value: lightThemeColors.tertiary["100"] },
          200: { value: lightThemeColors.tertiary["200"] },
          300: { value: lightThemeColors.tertiary["300"] },
          400: { value: lightThemeColors.tertiary["400"] },
          500: { value: lightThemeColors.tertiary["500"] },
          600: { value: lightThemeColors.tertiary["600"] },
          700: { value: lightThemeColors.tertiary["700"] },
          800: { value: lightThemeColors.tertiary["800"] },
        },
      },
    },
  },
})

export const darkTheme = createSystem(defaultConfig, {
  ...baseThemeConfig,
  theme: {
    ...baseThemeConfig.theme,
    tokens: {
      ...baseThemeConfig.theme.tokens,
      colors: {
        ...baseThemeConfig.theme.tokens.colors,
        primary: {
          50: { value: darkThemeColors.primary["50"] },
          100: { value: darkThemeColors.primary["100"] },
          200: { value: darkThemeColors.primary["200"] },
          300: { value: darkThemeColors.primary["300"] },
          400: { value: darkThemeColors.primary["400"] },
          500: { value: darkThemeColors.primary["500"] },
          600: { value: darkThemeColors.primary["600"] },
          700: { value: darkThemeColors.primary["700"] },
          800: { value: darkThemeColors.primary["800"] },
          900: { value: darkThemeColors.primary["900"] },
        },
        secondary: {
          50: { value: darkThemeColors.secondary["50"] },
          100: { value: darkThemeColors.secondary["100"] },
          200: { value: darkThemeColors.secondary["200"] },
          300: { value: darkThemeColors.secondary["300"] },
          400: { value: darkThemeColors.secondary["400"] },
          500: { value: darkThemeColors.secondary["500"] },
          600: { value: darkThemeColors.secondary["600"] },
          700: { value: darkThemeColors.secondary["700"] },
          800: { value: darkThemeColors.secondary["800"] },
          900: { value: darkThemeColors.secondary["900"] },
        },
        tertiary: {
          100: { value: darkThemeColors.tertiary["100"] },
          200: { value: darkThemeColors.tertiary["200"] },
          300: { value: darkThemeColors.tertiary["300"] },
          400: { value: darkThemeColors.tertiary["400"] },
          500: { value: darkThemeColors.tertiary["500"] },
          600: { value: darkThemeColors.tertiary["600"] },
          700: { value: darkThemeColors.tertiary["700"] },
          800: { value: darkThemeColors.tertiary["800"] },
        },
      },
    },
  },
})

// For now, we'll use the defaultSystem from Chakra UI
// In the future, we can create a custom system when we need to support theme switching
export const system = lightTheme
