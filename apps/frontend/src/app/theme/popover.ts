import { defineSlotRecipe } from "@chakra-ui/react"

export const popoverSlotRecipe = defineSlotRecipe({
  className: "popover",
  slots: ["content", "body", "header", "footer", "arrow", "arrowTip"],
  base: {
    content: {
      rounded: "2xl",
      border: "none",
      boxShadow: "lg",
      bg: {
        base: "white",
        _dark: "bg.primary", // Using theme color instead of hardcoded value
      },
    },
    body: {
      p: 2,
    },
    arrow: {
      "--arrow-size": "8px",
    },
    arrowTip: {
      borderTopColor: {
        base: "white",
        _dark: "bg.primary",
      },
      borderInlineStartColor: {
        base: "white",
        _dark: "bg.primary",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      sm: {
        content: {
          fontSize: "sm",
        },
        body: {
          p: 1.5,
        },
      },
      md: {
        content: {
          fontSize: "md",
        },
        body: {
          p: 2,
        },
      },
      lg: {
        content: {
          fontSize: "lg",
        },
        body: {
          p: 3,
        },
      },
    },
  },
})
