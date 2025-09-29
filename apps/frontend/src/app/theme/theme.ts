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
import { stepsSlotRecipe } from "./steps"
import { tableSlotRecipe } from "./table"

const config = defineConfig({
  preflight: true,
  cssVarsPrefix: "vbd",

  globalCss: {
    ":where(button, [role=button], a)": {
      cursor: "pointer",
    },
  },

  theme: {
    recipes: {
      heading: headingRecipe,
      button: buttonRecipe,
      input: inputRecipe,
      badge: badgeRecipe,
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
      table: tableSlotRecipe,
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
      colors: {
        primary: {
          DEFAULT: { value: "#3237FF" },
          100: { value: "#98A3FF" },
          200: { value: "#7F8CFF" },
          300: { value: "#6575FF" },
          400: { value: "#4C5EFF" },
          500: { value: "#3237FF" },
          600: { value: "#373EDF" },
          700: { value: "#2428B6" },
          800: { value: "#001665" },
          900: { value: "#000B3C" },
        },
      },
    },

    semanticTokens: {
      fonts: {
        body: {
          value: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol`,
        },
        heading: {
          value: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol`,
        },
      },

      colors: {
        "chakra-body-text": {
          value: {
            base: "#1E1E1E",
            _dark: "#E4E4E4",
          },
        },
        "chakra-body-bg": {
          value: {
            base: "#F7F7F7",
            _dark: "#131313",
          },
        },
        "info-bg": {
          value: {
            base: "#F8F8F8",
            _dark: "#1E1E1E",
          },
        },
        "dark-contrast-on-card-bg": {
          value: {
            base: "#F8F8F8",
            _dark: "#131313",
          },
        },
        "profile-bg": {
          value: {
            base: "#FFFFFF",
            _dark: "#2D2D2F",
          },
        },
        "contrast-on-dark-bg": {
          value: {
            base: "#FFFFFF",
            _dark: "#1A1A1A",
          },
        },
        "light-contrast-on-card-bg": {
          value: {
            base: "#FAFAFA",
            _dark: "#2D2D2F",
          },
        },
        "your-ranking-hover": {
          value: {
            base: "#005EFF",
            _dark: "#005EFF",
          },
        },
        "b3tr-balance-bg": {
          value: {
            base: "#E5EEFF",
            _dark: "#1A2547",
          },
        },
        "vot3-balance-bg": {
          value: {
            base: "#E3FFC4",
            _dark: "#1A2E0F",
          },
        },
        "contrast-bg-strong": {
          value: {
            base: "#000000",
            _dark: "#E2E8F0",
          },
        },
        "contrast-bg-muted": {
          value: {
            base: "#FFFFFF",
            _dark: "#2D3748",
          },
        },
        "contrast-bg-muted-hover": {
          value: {
            base: "#EFEFEF",
            _dark: "#A0AEC0",
          },
        },
        "contrast-bg-strong-hover": {
          value: {
            base: "#1A1A1A",
            _dark: "#CBD5E0",
          },
        },
        "contrast-fg-on-strong": {
          value: {
            base: "#FFFFFF",
            _dark: "#000000",
          },
        },
        "contrast-fg-on-muted": {
          value: {
            base: "#000000",
            _dark: "#FFFFFF",
          },
        },
        "hover-contrast-bg": {
          value: {
            base: "#F8F8F8",
            _dark: "#2D2F31",
          },
        },
        "contrast-border": {
          value: {
            base: "#EFEFEF",
            _dark: "#4A5568",
          },
        },
        "layout-bg": {
          value: {
            base: "#F7F7F7",
            _dark: "#131313",
          },
        },

        // --- new colors ---

        // TODO: add these colors to the theme to use primary as color palette
        // primary: {
        //   solid: { value: "{colors.primary.500}" },
        //   contrast: { value: "{colors.primary.100}" },
        //   fg: { value: "{colors.primary.700}" },
        //   muted: { value: "{colors.primary.100}" },
        //   subtle: { value: "{colors.primary.200}" },
        //   emphasized: { value: "{colors.primary.300}" },
        //   focusRing: { value: "{colors.primary.500}" },
        // },

        // Logo
        logo: {
          value: {
            _dark: "#277CDF",
            base: "#004CFC",
          },
        },

        brand: {
          primary: {
            value: {
              _dark: "#277CDF",
              base: "#004CFC",
            },
          },
          secondary: {
            _dark: { value: "#B4EA82" },
            base: { value: "#B1F16C" },
          },
          tertiary: {
            _dark: { value: "#FFFFFF" },
            base: { value: "#000000" },
          },
        },
        "secondary-strong": {
          value: {
            _dark: "#4F5945",
            base: "#6DCB09",
          },
        },
        "secondary-stronger": {
          value: {
            _dark: "#383F31",
            base: "#448300",
          },
        },
        "secondary-subtle": {
          value: {
            _dark: "#CDFF9F",
            base: "#CDFF9F",
          },
        },

        // Actions
        actions: {
          primary: {
            default: {
              value: {
                _dark: "#277CDF",
                base: "#004CFC",
              },
            },
            hover: {
              value: {
                _dark: "#2E67EA",
                base: "#0F58FF",
              },
            },
            pressed: {
              value: {
                _dark: "#0945D0",
                base: "#0045E5",
              },
            },
            disabled: {
              value: {
                _dark: "#272E37",
                base: "#E1E1E1",
              },
            },
            text: {
              value: {
                _dark: "#FFFFFF",
                base: "#FFFFFF",
              },
            },
            "text-disabled": {
              value: {
                _dark: "#828282",
                base: "#757575",
              },
            },
          },
          secondary: {
            default: {
              value: {
                _dark: "rgba(255, 255, 255, 0.2)",
                base: "#E0E9FE",
              },
            },
            hover: {
              value: {
                _dark: "#404B5E",
                base: "#EBF1FE",
              },
            },
            pressed: {
              value: {
                _dark: "#303746",
                base: "#CEDCFD",
              },
            },
            disabled: {
              value: {
                _dark: "#272E37",
                base: "#E1E1E1",
              },
            },
            text: {
              value: {
                _dark: "#FFFFFF",
                base: "#004CFC",
              },
            },
            "text-lighter": {
              value: {
                _dark: "#7CB7FC",
                base: "#004CFC",
              },
            },
            "text-disabled": {
              value: {
                _dark: "#828282",
                base: "#757575",
              },
            },
          },
          tertiary: {
            default: {
              value: {
                _dark: "#4D88FF",
                base: "#004CFC",
              },
            },
            hover: {
              value: {
                _dark: "#1A66FF",
                base: "#003ECC",
              },
            },
            pressed: {
              value: {
                _dark: "#004CFC",
                base: "#003199",
              },
            },
            disabled: {
              value: {
                _dark: "#747C89",
                base: "#747C89",
              },
            },
          },
        },

        // Text Colors
        text: {
          default: {
            value: {
              _dark: "#E4E4E4",
              base: "#252525",
            },
          },
          subtle: {
            value: {
              _dark: "#AAAFB6",
              base: "#525860",
            },
          },
          lighter: {
            value: {
              _dark: "#979797",
              base: "#6A6A6A",
            },
          },
          strong: {
            value: {
              _dark: "#FFFFFF",
              base: "#000000",
            },
          },
          darker: {
            value: {
              _dark: "#FFFFFF",
              base: "#000000",
            },
          },
          alt: {
            value: {
              _dark: "#000000",
              base: "#FFFFFF",
            },
          },
          "alt-subtle": {
            value: {
              _dark: "rgba(0, 0, 0, 0.7)",
              base: "rgba(255, 255, 255, 0.7)",
            },
          },
        },

        // Background Colors
        bg: {
          primary: {
            value: {
              _dark: "#1D1D1D",
              base: "#FFFFFF",
            },
          },
          secondary: {
            value: {
              _dark: "#131313",
              base: "#FAFAFA",
            },
          },
          tertiary: {
            value: {
              _dark: "#2F2F2F",
              base: "#F8F8F8",
            },
          },
        },

        // Border Colors
        border: {
          primary: {
            value: {
              _dark: "#2D2D2F",
              base: "#D5D5D5",
            },
          },
          secondary: {
            value: {
              _dark: "#2E2E32",
              base: "#EFEFEF",
            },
          },
          tertiary: {
            value: {
              _dark: "#4B4B4B",
              base: "rgba(255, 255, 255, 0.5)",
            },
          },
        },

        // Icon Colors
        icon: {
          default: {
            value: {
              _dark: "#FFFFFF",
              base: "#2D3748",
            },
          },
          subtle: {
            value: {
              _dark: "#AAAFB6",
              base: "#525860",
            },
          },
          darker: {
            value: {
              _dark: "#767676",
              base: "#171923",
            },
          },
          lighter: {
            value: {
              _dark: "#FFFFFF",
              base: "#6A6A6A",
            },
          },
        },

        // Status Colors - Info
        info: {
          strong: {
            value: {
              _dark: "#CBDDFF",
              base: "#0046CB",
            },
          },
          primary: {
            value: {
              _dark: "#A2C2FF",
              base: "#6194F5",
            },
          },
          secondary: {
            value: {
              _dark: "#A2C2FF",
              base: "#CBDDFF",
            },
          },
          subtle: {
            value: {
              _dark: "#2A303A",
              base: "#E5EEFF",
            },
          },
        },

        // Status Colors - Warning
        warning: {
          strong: {
            value: {
              _dark: "#FFC885",
              base: "#AF5F00",
            },
          },
          primary: {
            value: {
              _dark: "#F2A54E",
              base: "#F29B32",
            },
          },
          secondary: {
            value: {
              _dark: "#B2752C",
              base: "#FFE4C3",
            },
          },
          subtle: {
            value: {
              _dark: "#402404",
              base: "#FFF3E5",
            },
          },
        },

        // Status Colors - Error/Negative
        error: {
          strong: {
            value: {
              _dark: "#FC6D90",
              base: "#B62A4C",
            },
          },
          primary: {
            value: {
              _dark: "#D23F63",
              base: "#C84968",
            },
          },
          secondary: {
            value: {
              _dark: "#9C354E",
              base: "#EC9BAF",
            },
          },
          subtle: {
            value: {
              _dark: "#2C1D21",
              base: "#FCEEF1",
            },
          },
          "subtle-2": {
            value: {
              _dark: "#2C1D21",
              base: "#FCEEF1",
            },
          },
        },

        // Status Colors - Success/Positive
        success: {
          strong: {
            value: {
              _dark: "#A3E7D6",
              base: "#047229",
            },
          },
          primary: {
            value: {
              _dark: "#26C9A1",
              base: "#3DBA67",
            },
          },
          secondary: {
            value: {
              _dark: "#1EA181",
              base: "#99E0B1",
            },
          },
          subtle: {
            value: {
              _dark: "#212A23",
              base: "#E9FDF1",
            },
          },
        },

        // Status Colors - Neutral
        neutral: {
          subtle: {
            value: {
              _dark: "#363A3F",
              base: "#F1F2F3",
            },
          },
          strong: {
            value: {
              _dark: "#D2D5D9",
              base: "#525860",
            },
          },
        },

        // System Feedback
        feedback: {
          info: {
            value: {
              _dark: "#CBDDFF",
              base: "#CBDDFF",
            },
          },
          error: {
            value: {
              _dark: "#2C1D21",
              base: "#FCEEF1",
            },
          },
          success: {
            primary: {
              value: {
                _dark: "#26C9A1",
                base: "#26B491",
              },
            },
            tertiary: {
              value: {
                _dark: "#212A23",
                base: "#E2FDF6",
              },
            },
          },
        },

        // Graphs
        graphs: {
          "1": {
            value: {
              _dark: "#F0F4F7",
              base: "#203A87",
            },
          },
          "2": {
            value: {
              _dark: "#4BA0FD",
              base: "#225EED",
            },
          },
          "3": {
            value: {
              _dark: "#2C87F3",
              base: "#307AE6",
            },
          },
          "4": {
            value: {
              _dark: "#337BEA",
              base: "#5FA5F9",
            },
          },
          "5": {
            value: {
              _dark: "#1145CD",
              base: "#BEDBFE",
            },
          },
          "6": {
            value: {
              _dark: "#06308A",
              base: "#DBE9FD",
            },
          },
        },

        // Votes
        votes: {
          "abstain-default": {
            value: {
              _dark: "#FFFFFF",
              base: "#B59525",
            },
          },
          "abstain-strong": {
            value: {
              _dark: "#FFFFFF",
              base: "#A27112",
            },
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
