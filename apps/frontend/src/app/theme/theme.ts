import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

import { cardSlotRecipe } from "./card"
import { dialogSlotRecipe } from "./dialog"
import { stepsSlotRecipe } from "./steps"

import { buttonRecipe } from "./button"
import { inputRecipe, numberInputSlotRecipe } from "./input"
import { nativeSelectSlotRecipe } from "./native-select"
import { headingRecipe } from "./heading"

const config = defineConfig({
  preflight: true,
  // globalCss: {
  //   "html,body": {
  //     fontFamily: "var(--font-inter)",
  //   },
  //   "h1,h2,h3,h4,h5,h6": {
  //     fontFamily: "var(--font-instrument-sans)",
  //   },
  // },

  theme: {
    recipes: {
      heading: headingRecipe,
      button: buttonRecipe,
      input: inputRecipe,
    },

    slotRecipes: {
      card: cardSlotRecipe,
      dialog: dialogSlotRecipe,
      steps: stepsSlotRecipe,
      nativeSelect: nativeSelectSlotRecipe,
      numberInput: numberInputSlotRecipe,
    },

    keyframes: {
      pulse: {
        "0%": { transform: "scale(1, 1)", opacity: 1 },
        "100%": { transform: "scale(1.5, 1.5)", opacity: 0 },
      },
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
      fonts: {
        body: { value: "var(--font-inter)" },
        heading: { value: "var(--font-instrument-sans)" },
      },

      colors: {
        // layout
        "layout-bg": {
          _light: { value: "#F7F7F7" },
          _dark: { value: "#131313" },
        },

        // Chakra Colors
        "chakra-body-text": {
          _light: { value: "#1E1E1E" },
          _dark: { value: "#E4E4E4" },
        },
        "chakra-body-bg": {
          _light: { value: "#F7F7F7" },
          _dark: { value: "#131313" },
        },

        // Logo
        logo: {
          _dark: { value: "#277CDF" },
          base: { value: "#004CFC" },
        },

        // Brand Colors
        primary: {
          _dark: { value: "#277CDF" },
          base: { value: "#004CFC" },
        },
        secondary: {
          _dark: { value: "#B4EA82" },
          base: { value: "#B1F16C" },
        },
        tertiary: {
          _dark: { value: "#FFFFFF" },
          base: { value: "#000000" },
        },
        "secondary-strong": {
          _dark: { value: "#4F5945" },
          base: { value: "#6DCB09" },
        },
        "secondary-stronger": {
          _dark: { value: "#383F31" },
          base: { value: "#448300" },
        },
        "secondary-subtle": {
          _dark: { value: "#CDFF9F" },
          base: { value: "#CDFF9F" },
        },

        // Actions
        actions: {
          primary: {
            default: {
              _dark: { value: "#277CDF" },
              base: { value: "#004CFC" },
            },
            hover: {
              _dark: { value: "#2E67EA" },
              base: { value: "#0F58FF" },
            },
            pressed: {
              _dark: { value: "#0945D0" },
              base: { value: "#0045E5" },
            },
            disabled: {
              _dark: { value: "#272E37" },
              base: { value: "#E1E1E1" },
            },
            text: {
              _dark: { value: "#FFFFFF" },
              base: { value: "#FFFFFF" },
            },
            "text-disabled": {
              _dark: { value: "#828282" },
              base: { value: "#757575" },
            },
          },
          secondary: {
            default: {
              _dark: { value: "rgba(255, 255, 255, 0.2)" },
              base: { value: "#E0E9FE" },
            },
            hover: {
              _dark: { value: "#404B5E" },
              base: { value: "#EBF1FE" },
            },
            pressed: {
              _dark: { value: "#303746" },
              base: { value: "#CEDCFD" },
            },
            disabled: {
              _dark: { value: "#272E37" },
              base: { value: "#E1E1E1" },
            },
            text: {
              _dark: { value: "#FFFFFF" },
              base: { value: "#004CFC" },
            },
            "text-lighter": {
              _dark: { value: "#7CB7FC" },
              base: { value: "#004CFC" },
            },
            "text-disabled": {
              _dark: { value: "#828282" },
              base: { value: "#757575" },
            },
          },
        },

        // Text Colors
        text: {
          default: {
            _dark: { value: "#E4E4E4" },
            base: { value: "#252525" },
          },
          subtle: {
            _dark: { value: "#979797" },
            base: { value: "#6A6A6A" },
          },
          lighter: {
            _dark: { value: "#979797" },
            base: { value: "#6A6A6A" },
          },
          strong: {
            _dark: { value: "#FFFFFF" },
            base: { value: "#000000" },
          },
          darker: {
            _dark: { value: "#FFFFFF" },
            base: { value: "#000000" },
          },
          alt: {
            _dark: { value: "#000000" },
            base: { value: "#FFFFFF" },
          },
          "alt-subtle": {
            _dark: { value: "rgba(0, 0, 0, 0.7)" },
            base: { value: "rgba(255, 255, 255, 0.7)" },
          },
        },

        // Background Colors
        bg: {
          primary: {
            _dark: { value: "#1D1D1D" },
            base: { value: "#FFFFFF" },
          },
          secondary: {
            _dark: { value: "#131313" },
            base: { value: "#FAFAFA" },
          },
          tertiary: {
            _dark: { value: "#2F2F2F" },
            base: { value: "#F8F8F8" },
          },
        },

        // Border Colors
        border: {
          primary: {
            _dark: { value: "#2D2D2F" },
            base: { value: "#D5D5D5" },
          },
          secondary: {
            _dark: { value: "#2E2E32" },
            base: { value: "#EFEFEF" },
          },
          tertiary: {
            _dark: { value: "#4B4B4B" },
            base: { value: "rgba(255, 255, 255, 0.5)" },
          },
        },

        // Icon Colors
        icon: {
          default: {
            _dark: { value: "#FFFFFF" },
            base: { value: "#2D3748" },
          },
          darker: {
            _dark: { value: "#767676" },
            base: { value: "#171923" },
          },
          lighter: {
            _dark: { value: "#FFFFFF" },
            base: { value: "#6A6A6A" },
          },
        },

        // Status Colors - Info
        info: {
          strong: {
            _dark: { value: "#CBDDFF" },
            base: { value: "#0046CB" },
          },
          primary: {
            _dark: { value: "#A2C2FF" },
            base: { value: "#6194F5" },
          },
          secondary: {
            _dark: { value: "#A2C2FF" },
            base: { value: "#CBDDFF" },
          },
          subtle: {
            _dark: { value: "#2A303A" },
            base: { value: "#E5EEFF" },
          },
        },

        // Status Colors - Warning
        warning: {
          strong: {
            _dark: { value: "#FFC885" },
            base: { value: "#AF5F00" },
          },
          primary: {
            _dark: { value: "#F29B32" },
            base: { value: "#F29B32" },
          },
          secondary: {
            _dark: { value: "#B2752C" },
            base: { value: "#FFE4C3" },
          },
          subtle: {
            _dark: { value: "#36322D" },
            base: { value: "#FFF3E5" },
          },
        },

        // Status Colors - Error/Negative
        error: {
          primary: {
            _dark: { value: "#D23F63" },
            base: { value: "#C84968" },
          },
          secondary: {
            _dark: { value: "#9C354E" },
            base: { value: "#EC9BAF" },
          },
          subtle: {
            _dark: { value: "#2C1D21" },
            base: { value: "#FCEEF1" },
          },
          "subtle-2": {
            _dark: { value: "#2C1D21" },
            base: { value: "#FCEEF1" },
          },
        },

        // Status Colors - Success/Positive
        success: {
          strong: {
            _dark: { value: "#A3E7D6" },
            base: { value: "#047229" },
          },
          primary: {
            _dark: { value: "#26C9A1" },
            base: { value: "#3DBA67" },
          },
          secondary: {
            _dark: { value: "#1EA181" },
            base: { value: "#99E0B1" },
          },
          subtle: {
            _dark: { value: "#212A23" },
            base: { value: "#E9FDF1" },
          },
        },

        // System Feedback
        feedback: {
          info: {
            _dark: { value: "#CBDDFF" },
            base: { value: "#CBDDFF" },
          },
          error: {
            _dark: { value: "#2C1D21" },
            base: { value: "#FCEEF1" },
          },
          success: {
            primary: {
              _dark: { value: "#26C9A1" },
              base: { value: "#26B491" },
            },
            tertiary: {
              _dark: { value: "#212A23" },
              base: { value: "#E2FDF6" },
            },
          },
        },

        // Graphs
        graphs: {
          "1": {
            _dark: { value: "#F0F4F7" },
            base: { value: "#203A87" },
          },
          "2": {
            _dark: { value: "#4BA0FD" },
            base: { value: "#225EED" },
          },
          "3": {
            _dark: { value: "#2C87F3" },
            base: { value: "#307AE6" },
          },
          "4": {
            _dark: { value: "#337BEA" },
            base: { value: "#5FA5F9" },
          },
          "5": {
            _dark: { value: "#1145CD" },
            base: { value: "#BEDBFE" },
          },
          "6": {
            _dark: { value: "#06308A" },
            base: { value: "#DBE9FD" },
          },
        },

        // Votes
        votes: {
          "abstain-default": {
            _dark: { value: "#FFFFFF" },
            base: { value: "#B59525" },
          },
          "abstain-strong": {
            _dark: { value: "#FFFFFF" },
            base: { value: "#A27112" },
          },
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
