import { ThemeConfig, extendTheme, keyframes } from "@chakra-ui/react"
import "@fontsource-variable/instrument-sans"
import "@fontsource-variable/inter"

const themeConfig: ThemeConfig = {
  //@ts-ignore
  fonts: {
    heading: `"Instrument Sans Variable", sans-serif`,
    body: `"Inter Variable", sans-serif`,
  },

  // 2. Add your color mode config
  initialColorMode: "system",
  useSystemColorMode: true,
  /* eslint-disable  @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  colors: {
    darkerPrimary: {
      100: "#726BBA",
      200: "#5C58AA",
      300: "#504D9E",
      400: "#453D8E",
      500: "#30265F",
      600: "#2B2356",
      700: "#241F4B",
      800: "#1B1741",
    },
    primary: {
      50: "#e9eafb", // Lightest shade
      100: "#bdbff4",
      200: "#9195ed",
      300: "#656be6",
      400: "#3940df",
      500: "#2027c6", // Primary color
      600: "#191e9a",
      700: "#12156e",
      800: "#0b0d42",
      900: "#040416", // Darkest shade
    },
    secondary: {
      50: "#f3fde8", // Lightest shade
      100: "#dbf9b9", // Lighter shade
      200: "#c3f58a",
      300: "#aaf15b",
      400: "#92ed2c", // Primary color
      500: "#79d312",
      600: "#5ea40e",
      700: "#43750a",
      800: "#284606", // Darker shade
    },
    tertiary: {
      100: "#c0d98c", // Lighter shade
      200: "#a6cf75",
      300: "#8cc65d",
      400: "#72bc46", // Primary color
      500: "#58b22f",
      600: "#3ea917",
      700: "#249e00",
      800: "#0a9400", // Darker shade
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

export const theme = extendTheme(themeConfig)
