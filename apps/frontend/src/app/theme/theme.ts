import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

import { alertSlotRecipe } from "./alert"
import { badgeRecipe } from "./badge"
import { buttonRecipe } from "./button"
import { cardSlotRecipe } from "./card"
import { checkboxSlotRecipe } from "./checkbox"
import { dialogSlotRecipe } from "./dialog"
import { headingRecipe } from "./heading"
import { inputRecipe, numberInputSlotRecipe } from "./input"
import { nativeSelectSlotRecipe } from "./native-select"
import { popoverSlotRecipe } from "./popover"
import { radioGroupSlotRecipe } from "./radio-group"
import { selectSlotRecipe } from "./select"
import { separatorRecipe } from "./separator"
import { skeletonRecipe } from "./skeleton"
import { stepsSlotRecipe } from "./steps"
import { switchSlotRecipe } from "./switch"
import { tableSlotRecipe } from "./table"
import { tabsSlotRecipe } from "./tabs"
import { textRecipe } from "./text"

const config = defineConfig({
  preflight: true,
  cssVarsPrefix: "vbd",
  globalCss: {
    "html,body": { bg: "bg.secondary" },
    ":where(button, [role=button], [type=button], a)": {
      cursor: "pointer",
    },
  },
  // TODO: use this to force using tokens
  // strictTokens: true,
  theme: {
    textStyles: {
      "6xl": { value: { fontSize: "3.75rem", lineHeight: "3.75rem" } }, //60px
      "5xl": { value: { fontSize: "3rem", lineHeight: "3.25rem" } }, //48px
      "4xl": { value: { fontSize: "2.25rem", lineHeight: "2.75rem" } }, //36px
      "3xl": { value: { fontSize: "1.75rem", lineHeight: "2.25rem" } }, //28px
      "2xl": { value: { fontSize: "1.5rem", lineHeight: "2rem" } }, //24px
      xl: { value: { fontSize: "1.25rem", lineHeight: "1.875rem" } }, //20px
      lg: { value: { fontSize: "1.125rem", lineHeight: "1.75rem" } }, //18px
      md: { value: { fontSize: "1rem", lineHeight: "1.5rem" } }, //16px
      sm: { value: { fontSize: "0.875rem", lineHeight: "1.25rem" } }, //14px
      xs: { value: { fontSize: "0.75rem", lineHeight: "1rem" } }, //12px
      xxs: { value: { fontSize: "0.625rem", lineHeight: "0.875rem" } }, //10px
    },
    recipes: {
      heading: headingRecipe,
      button: buttonRecipe,
      input: inputRecipe,
      badge: badgeRecipe,
      skeleton: skeletonRecipe,
      separator: separatorRecipe,
      text: textRecipe,
    },

    slotRecipes: {
      alert: alertSlotRecipe,
      card: cardSlotRecipe,
      dialog: dialogSlotRecipe,
      steps: stepsSlotRecipe,
      nativeSelect: nativeSelectSlotRecipe,
      select: selectSlotRecipe,
      numberInput: numberInputSlotRecipe,
      popover: popoverSlotRecipe,
      checkbox: checkboxSlotRecipe,
      radioGroup: radioGroupSlotRecipe,
      switch: switchSlotRecipe,
      table: tableSlotRecipe,
      tabs: tabsSlotRecipe,
    },

    keyframes: {
      // pulse: {
      //   "0%": { transform: "scale(1, 1)", opacity: 1 },
      //   "100%": { transform: "scale(1.5, 1.5)", opacity: 0 },
      // },
      rotateBgPosition: {
        "0%": { backgroundPosition: "0% 50%" },
        "100%": { backgroundPosition: "100% 50%" },
      },
      backdropBlur: {
        "0%": { backdropFilter: "blur(0px)" },
        "100%": { backdropFilter: "blur(10px)" },
      },
    },

    tokens: {
      spacing: {
        "0": { value: "0" },
      },
      colors: {
        transparency: {
          DEFAULT: { value: "rgba(255, 255, 255, 0.15)" },
          100: { value: "rgba(255, 255, 255, 0.15)" },
          200: { value: "rgba(255, 255, 255, 0.20)" },
          300: { value: "rgba(255, 255, 255, 0.30)" },
          400: { value: "rgba(255, 255, 255, 0.40)" },
          500: { value: "rgba(255, 255, 255, 0.50)" },
          600: { value: "rgba(255, 255, 255, 0.60)" },
          700: { value: "rgba(255, 255, 255, 0.70)" },
          800: { value: "rgba(255, 255, 255, 0.80)" },
          900: { value: "rgba(255, 255, 255, 0.90)" },
        },
        opacity: {
          DEFAULT: { value: "rgba(0, 0, 0, 0.15)" },
          100: { value: "rgba(0, 0, 0, 0.15)" },
          200: { value: "rgba(0, 0, 0, 0.20)" },
          300: { value: "rgba(0, 0, 0, 0.30)" },
          400: { value: "rgba(0, 0, 0, 0.40)" },
          500: { value: "rgba(0, 0, 0, 0.50)" },
          600: { value: "rgba(0, 0, 0, 0.60)" },
          700: { value: "rgba(0, 0, 0, 0.70)" },
          800: { value: "rgba(0, 0, 0, 0.80)" },
          900: { value: "rgba(0, 0, 0, 0.90)" },
        },
        gray: {
          DEFAULT: { value: "#525860" },
          50: { value: "#F9F9FA" },
          100: { value: "#F1F2F3" },
          200: { value: "#E7E9EB" },
          300: { value: "#D2D5D9" },
          400: { value: "#AAAFB6" },
          500: { value: "#747C89" },
          600: { value: "#525860" },
          700: { value: "#363A3F" },
          800: { value: "#272A2E" },
          900: { value: "#1B1D1F" },
        },
        blue: {
          DEFAULT: { value: "#004CFC" },
          50: { value: "#E6EEFF" },
          100: { value: "#D4E2FF" },
          200: { value: "#B3CCFF" },
          300: { value: "#80AAFF" },
          400: { value: "#4D88FF" },
          500: { value: "#1A66FF" },
          600: { value: "#004CFC" },
          700: { value: "#003ECC" },
          800: { value: "#003199" },
          900: { value: "#002466" },
        },
        red: {
          DEFAULT: { value: "#D44145" },
          50: { value: "#FCEEF1" },
          100: { value: "#F4CCCF" },
          200: { value: "#E99A9E" },
          300: { value: "#DF6A6E" },
          400: { value: "#D44145" },
          500: { value: "#C53030" },
          600: { value: "#9B2323" },
          700: { value: "#7F1C1C" },
          800: { value: "#631616" },
          900: { value: "#400E0E" },
        },
      },
    },

    semanticTokens: {
      colors: {
        // for the places use "colorPalette"
        blue: {
          contrast: { value: { _light: "white", _dark: "white" } },
          fg: { value: { _light: "{colors.blue.700}", _dark: "{colors.blue.300}" } },
          subtle: { value: { _light: "{colors.blue.100}", _dark: "{colors.blue.900}" } },
          muted: { value: { _light: "{colors.blue.200}", _dark: "{colors.blue.800}" } },
          emphasized: { value: { _light: "{colors.blue.300}", _dark: "{colors.blue.700}" } },
          solid: { value: { _light: "{colors.blue.600}", _dark: "{colors.blue.400}" } },
          focusRing: { value: { _light: "{colors.blue.600}", _dark: "{colors.blue.400}" } },
        },
        red: {
          contrast: { value: { _light: "white", _dark: "white" } },
          fg: { value: { _light: "{colors.red.400}", _dark: "{colors.red.300}" } },
          subtle: { value: { _light: "{colors.red.100}", _dark: "{colors.red.900}" } },
          muted: { value: { _light: "{colors.red.200}", _dark: "{colors.red.800}" } },
          emphasized: { value: { _light: "{colors.red.300}", _dark: "{colors.red.700}" } },
          solid: { value: { _light: "{colors.red.600}", _dark: "{colors.red.400}" } },
          focusRing: { value: { _light: "{colors.red.400}", _dark: "{colors.red.400}" } },
        },

        brand: {
          primary: { value: { base: "{colors.blue.600}", _dark: "white" } },
          secondary: { value: { base: "#B1F16C", _dark: "#B4EA82" } },
          tertiary: { value: { base: "white", _dark: "black" } },
          "secondary-strong": { value: { base: "#6DCB09", _dark: "#4F5945" } },
          "secondary-stronger": { value: { base: "#448300", _dark: "#383F31" } },
          "secondary-subtle": { value: { base: "#CDFF9F", _dark: "#CDFF9F" } },
        },

        actions: {
          primary: {
            default: { value: { base: "{colors.blue.600}", _dark: "{colors.blue.400}" } },
            hover: { value: { base: "{colors.blue.700}", _dark: "{colors.blue.500}" } },
            pressed: { value: { base: "{colors.blue.800}", _dark: "{colors.blue.600}" } },
            disabled: { value: { base: "{colors.gray.300}", _dark: "{colors.gray.700}" } },
            text: { value: { base: "white", _dark: "white" } },
            "text-disabled": { value: { base: "{colors.gray.500}", _dark: "{colors.gray.500}" } },
          },
          secondary: {
            default: { value: { base: "{colors.blue.50}", _dark: "{colors.transparency.300}" } },
            hover: { value: { base: "{colors.blue.100}", _dark: "{colors.transparency.200}" } },
            pressed: { value: { base: "{colors.blue.200}", _dark: "{colors.transparency.100}" } },
            disabled: { value: { base: "{colors.gray.300}", _dark: "{colors.transparency.100}" } },
            text: { value: { base: "{colors.blue.600}", _dark: "white" } },
            "text-disabled": { value: { base: "{colors.gray.500}", _dark: "{colors.gray.500}" } },
          },
          tertiary: {
            default: { value: { base: "white", _dark: "{colors.transparency.100}" } },
            hover: { value: { base: "{colors.gray.50}", _dark: "{colors.gray.800}" } },
            pressed: { value: { base: "{colors.gray.100}", _dark: "{colors.gray.700}" } },
            disabled: { value: { base: "{colors.gray.500}", _dark: "{colors.gray.500}" } },
            text: { value: { base: "white", _dark: "white" } },
            "text-disabled": { value: { base: "{colors.gray.500}", _dark: "{colors.gray.500}" } },
          },
          negative: {
            default: { value: { base: "{colors.red.500}", _dark: "{colors.red.400}" } },
            hover: { value: { base: "{colors.red.600}", _dark: "{colors.red.500}" } },
            pressed: { value: { base: "{colors.red.600}", _dark: "{colors.red.600}" } },
            text: { value: { base: "{colors.red.50}", _dark: "white" } },
          },
          disabled: {
            disabled: { value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" } },
            text: { value: { base: "{colors.gray.400}", _dark: "{colors.gray.500}" } },
          },
        },

        borders: {
          primary: { value: { base: "{colors.gray.300}", _dark: "{colors.gray.600}" } },
          secondary: { value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" } },
          active: { value: { base: "{colors.blue.600}", _dark: "{colors.blue.400}" } },
        },

        text: {
          default: { value: { base: "{colors.gray.800}", _dark: "white" } },
          subtle: { value: { base: "{colors.gray.600}", _dark: "{colors.gray.400}" } },
          alt: { value: { base: "white", _dark: "black" } },
          "alt-subtle": { value: { base: "{colors.transparency.700}", _dark: "{colors.opacity.700}" } },
        },
        bg: {
          primary: { value: { base: "white", _dark: "{colors.gray.900}" } },
          secondary: { value: { base: "{colors.gray.50}", _dark: "black" } },
          tertiary: { value: { base: "#F5F5F5", _dark: "#262626" } },
        },
        banner: {
          blue: { value: { base: "{colors.blue.200}", _dark: "{colors.blue.900}" } },
          green: { value: { base: "#B1F16C", _dark: "#383F31" } },
          yellow: { value: { base: "#FFD979", _dark: "#54441A" } },
          "dashboard-tokens": { value: { base: "#0153F2", _dark: "{colors.blue.900}" } },
        },
        card: {
          default: { value: { base: "white", _dark: "{colors.gray.900}" } },
          subtle: { value: { base: "{colors.gray.50}", _dark: "{colors.gray.700}" } },
          hover: { value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" } },
          "active-border": { value: { base: "{colors.blue.600}", _dark: "{colors.blue.400}" } },
        },
        border: {
          primary: { value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" } },
          secondary: { value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" } },
          tertiary: { value: { base: "{colors.transparency.500}", _dark: "#4B4B4B" } },
          active: { value: { base: "{colors.blue.600}", _dark: "{colors.blue.400}" } },
        },
        icon: {
          default: { value: { base: "{colors.gray.800}", _dark: "white" } },
          subtle: { value: { base: "{colors.gray.600}", _dark: "{colors.gray.400}" } },
        },
        status: {
          positive: {
            strong: { value: { base: "#047229", _dark: "#A3E706" } },
            primary: { value: { base: "#3DBA67", _dark: "#26C9A1" } },
            secondary: { value: { base: "#99E0B1", _dark: "#1EA181" } },
            subtle: { value: { base: "#E9FDF1", _dark: "#212A23" } },
          },
          negative: {
            strong: { value: { base: "#B6244C", _dark: "#EC4D9C" } },
            primary: { value: { base: "#C84868", _dark: "#D23F63" } },
            secondary: { value: { base: "#EC98AF", _dark: "#9C354E" } },
            subtle: { value: { base: "#FCEEF1", _dark: "#2C1D21" } },
          },
          info: {
            strong: { value: { base: "#2D65D1", _dark: "#CBD0FF" } },
            primary: { value: { base: "#6194F5", _dark: "#A2C2FF" } },
            secondary: { value: { base: "#CBD0FF", _dark: "#8930CE" } },
            subtle: { value: { base: "#E5E5FF", _dark: "#2A303A" } },
          },
          warning: {
            strong: { value: { base: "#AF5F00", _dark: "#FFC985" } },
            primary: { value: { base: "#F29832", _dark: "#F29832" } },
            secondary: { value: { base: "#FFE4C3", _dark: "#B2752C" } },
            subtle: { value: { base: "#FFF3E5", _dark: "#36322D" } },
          },
          neutral: {
            strong: { value: { base: "{colors.gray.600}", _dark: "{colors.gray.300}" } },
            primary: { value: { base: "{colors.gray.300}", _dark: "{colors.gray.400}" } },
            secondary: { value: { base: "{colors.gray.200}", _dark: "{colors.gray.500}" } },
            subtle: { value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" } },
          },
        },
        // graph colors will change after allocations redesign
        graph: {
          1: { value: { base: "#203A87", _dark: "#F0F4F7" } },
          2: { value: { base: "#225EED", _dark: "#4BA0FD" } },
          3: { value: { base: "#307AE6", _dark: "#2C87F3" } },
          4: { value: { base: "#5FA5F9", _dark: "#337BEA" } },
          5: { value: { base: "#BEDBFE", _dark: "#1145CD" } },
          6: { value: { base: "#DBE9FD", _dark: "#06308A" } },
        },
        calendar: {
          1: { value: { base: "#739E45", _dark: "#B4EA82" } },
          2: { value: { base: "#97CE5B", _dark: "#B4EA82B3" } },
          3: { value: { base: "#B1F16C", _dark: "#B4EA8266" } },
          4: { value: { base: "#B1F16C80", _dark: "#B4EA8233" } },
        },

        social: {
          telegram: { value: { base: "#0088cc", _dark: "#0088cc" } },
          discord: { value: { base: "#5865F2", _dark: "#5865F2" } },
          youtube: { value: { base: "#FF0000", _dark: "#FF0000" } },
          medium: { value: { base: "black", _dark: "black" } },
          twitter: { value: { base: "black", _dark: "black" } },
        },
      },
      animations: {
        pulse: { value: "pulse 1.5s infinite" },
        rotateBgPosition: { value: "rotateBgPosition 1.5s infinite alternate" },
        backdropBlur: { value: "backdropBlur 1s ease-in-out" },
      },
    },
  },
})

const theme = createSystem(defaultConfig, config)

export default theme
