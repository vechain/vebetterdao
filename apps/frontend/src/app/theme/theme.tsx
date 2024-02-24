import { StyleFunctionProps, ThemeConfig, extendTheme, keyframes } from "@chakra-ui/react"
import "@fontsource-variable/instrument-sans"
import "@fontsource-variable/inter"
import { lighSecondary, lightPrimary, lightTertiary } from "./colors"
import { cardTheme } from "./card"
const themeConfig: ThemeConfig = {
  //@ts-ignore
  fonts: {
    heading: `"Instrument Sans Variable", sans-serif`,
    body: `"Inter Variable", sans-serif`,
  },

  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        color: "default",
        bg: props.colorMode === "dark" ? "#131313" : "#F7F7F7",
      },
    }),
  },

  components: {
    Card: cardTheme,
    Button: {
      // 6. We can overwrite defaultProps
      defaultProps: {
        size: "md",
        borderRadius: "full",
      },
    },
  },

  // 2. Add your color mode config
  initialColorMode: "system",
  useSystemColorMode: true,
  /* eslint-disable  @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  colors: {
    primary: lightPrimary,
    secondary: lighSecondary,
    tertiary: lightTertiary,
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

export const theme = extendTheme({ ...themeConfig })
