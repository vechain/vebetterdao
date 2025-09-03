import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    rounded: "md",
    fontWeight: 600,
  },
  variants: {
    variant: {
      primary: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: 6,
        py: 3,
        color: "actions.primary.text",
        bgColor: "actions.primary.default",
        _hover: {
          bg: "actions.primary.hover",
          _disabled: {
            bg: "actions.primary.disabled",
          },
        },
      },

      secondary: {
        rounded: "full",
        fontSize: "1rem",
        fontWeight: 500,
        px: 6,
        py: 3,
        color: "actions.secondary.text",
        bgColor: "actions.secondary.default",
        _hover: {
          bg: "actions.secondary.hover",
          _disabled: {
            bg: "actions.secondary.disabled",
          },
        },
      },

      tertiary: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: 6,
        py: 3,
        color: "actions.tertiary.text",
        bgColor: "actions.tertiary.default",
        _hover: {
          bg: "actions.tertiary.hover",
          _disabled: {
            bg: "actions.tertiary.disabled",
          },
        },
      },

      primarySubtle: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        bgColor: "#E0E9FE",
        color: "#004CFC",
        _hover: {
          bg: "rgba(224, 233, 254, 0.8)",
        },
      },
      primaryLink: {
        p: 0,
        textStyle: "md",
        fontWeight: "semibold",
        color: "actions.secondary.text-lighter",
        _hover: {
          color: "actions.secondary.hover",
          _disabled: {
            color: "actions.secondary.disabled",
          },
        },
      },
      primaryAction: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: 6,
        py: 3,
        color: "actions.primary.text",
        bgColor: "actions.primary.default",
        _hover: {
          bg: "actions.primary.hover",
          _disabled: {
            bg: "actions.primary.disabled",
          },
        },
      },
      tertiaryAction: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        color: "#004CFC",
        bgColor: "rgba(177, 241, 108, 1)",
        _hover: {
          bg: "rgba(177, 241, 108, 0.9)",
          _disabled: {
            bg: "rgba(177, 241, 108, 0.7)",
          },
        },
      },
      whiteAction: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        color: "#004CFC",
        bgColor: "rgba(224, 233, 254, 1)",
        _hover: {
          bg: "rgba(224, 233, 254, 0.9)",
          _disabled: {
            bg: "rgba(224, 233, 254, 0.7)",
          },
        },
      },
      primaryGhost: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        color: "#004CFC",
        bgColor: "transparent",
        _hover: {
          bg: "#004CFC22",
          _disabled: {
            bg: "transparent",
          },
        },
      },
      dangerGhost: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        color: "#D23F63",
        bgColor: "transparent",
        _hover: {
          bg: "#D23F6322",
          _disabled: {
            bg: "transparent",
          },
        },
      },
      dangerFilled: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        color: "#FFFFFF",
        bgColor: "#D23F63",
        _hover: {
          bg: "#cd1e49",
          _disabled: {
            bg: "#D23F63",
          },
        },
      },
      dangerFilledTonal: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        color: "#D23F63",
        bgColor: "#FCEEF1",
        _hover: {
          bg: "#feccd7",
          _disabled: {
            bg: "#FCEEF1",
          },
        },
      },
      // ICON BUTTON VARIANTS
      // this is strange but seems like icon buttons take the variant from the button
      primaryIconButton: {
        rounded: "full",
        bgColor: "#E0E9FE",
        color: "#004CFC",
        h: "40px",
        w: "40px",
        _hover: {
          bg: "#E0E9FEAA",
        },
      },
      applyButton: {
        rounded: "full",
        fontSize: "16px",
        fontWeight: 500,
        px: "24px",
        bgColor: "#D6FFAA",
        color: "#253C0C",
        _hover: {
          bg: "#E0E9FEAA",
        },
      },
    },
  },
})
