import { ThemeConfig, extendTheme, keyframes } from "@chakra-ui/react"

const themeConfig: ThemeConfig = {
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
      50: "#e9e6f4", // Lightest shade
      100: "#d0c9e9",
      200: "#b6b0de",
      300: "#9c97d3",
      400: "#837ec9",
      500: "#6965be", // Primary color
      600: "#504cb3",
      700: "#3643a9",
      800: "#1c2a9e",
      900: "#00008c", // Darkest shade
    },
    secondary: {
      100: "#9adff2", // Lighter shade
      200: "#7ed4ee",
      300: "#62c9ea",
      400: "#46bee6", // Primary color
      500: "#2ab3e2",
      600: "#0fa8de",
      700: "#0093c5",
      800: "#007ea9", // Darker shade
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
