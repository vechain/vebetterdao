import { extendTheme, keyframes } from "@chakra-ui/react"
import { darkThemeColors, lightThemeColors } from "./colors"
import { cardTheme } from "./card"
import "@fontsource-variable/instrument-sans"
import "@fontsource-variable/inter"
import { ButtonStyle } from "./button"
import { StepperStyle } from "./stepper"
import { SelectStyle } from "./select"
import { InputStyle } from "./input"
import { ModalStyle } from "./modal"

const themeConfig = {
  //@ts-ignore
  fonts: {
    heading: `"Instrument Sans Variable", sans-serif`,
    body: `"Inter Variable", sans-serif`,
  },

  components: {
    Card: cardTheme,
    Button: ButtonStyle,
    Stepper: StepperStyle,
    Select: SelectStyle,
    Input: InputStyle,
    Modal: ModalStyle,
  },

  // 2. Add your color mode config
  initialColorMode: "system",
  useSystemColorMode: true,
  //@ts-ignore
  semanticTokens: {
    colors: {
      "chakra-body-text": {
        _light: "#1E1E1E",
        _dark: "#E4E4E4",
      },
      "chakra-body-bg": {
        _light: "#F7F7F7",
        _dark: "#131313",
      },
      "info-bg": {
        _light: "#F8F8F8",
        _dark: "#1E1E1E",
      },
      "dark-contrast-on-card-bg": {
        _light: "#F8F8F8",
        _dark: "#131313",
      },
      "profile-bg": {
        _light: "#FFFFFF",
        _dark: "#2D2D2F",
      },
      "contrast-on-dark-bg": {
        _light: "#FFFFFF",
        _dark: "#1A1A1A",
      },
      "light-contrast-on-card-bg": {
        _light: "#FAFAFA",
        _dark: "#2D2D2F",
      },
      "your-ranking-hover": {
        _light: "#005EFF",
        _dark: "#005EFF",
      },
      "b3tr-balance-bg": {
        _light: "#E5EEFF",
        _dark: "#1A2547",
      },
      "vot3-balance-bg": {
        _light: "#E3FFC4",
        _dark: "#1A2E0F",
      },
      "contrast-bg-strong": {
        _light: "#000000",
        _dark: "#E2E8F0",
      },
      "contrast-bg-muted": {
        _light: "#FFFFFF",
        _dark: "#2D3748",
      },
      "contrast-bg-muted-hover": {
        _light: "#EFEFEF",
        _dark: "#A0AEC0",
      },
      "contrast-bg-strong-hover": {
        _light: "#1A1A1A",
        _dark: "#CBD5E0",
      },
      "contrast-fg-on-strong": {
        _light: "#FFFFFF",
        _dark: "#000000",
      },
      "contrast-fg-on-muted": {
        _light: "#000000",
        _dark: "#FFFFFF",
      },
      "hover-contrast-bg": {
        _light: "#F8F8F8",
        _dark: "#2D2F31",
      },
      "contrast-border": {
        _light: "#EFEFEF",
        _dark: "#4A5568",
      },
    },
  },
  colors: {
    //dynamic primary coor based on the light/dark
    green: {
      "50": "#f3f9f3",
      "100": "#cfe6d0",
      "200": "#a4d1a6",
      "300": "#6fb672",
      "400": "#51a654",
      "500": "#259029",
      "600": "#007b05",
      "700": "#006304",
      "800": "#005403",
      "900": "#003d02",
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

export const lightTheme = extendTheme({
  ...themeConfig,
  colors: lightThemeColors,
})
export const darkTheme = extendTheme({
  ...themeConfig,
  colors: darkThemeColors,
})
