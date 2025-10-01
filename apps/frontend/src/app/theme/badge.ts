import { defineRecipe } from "@chakra-ui/react"

export const badgeRecipe = defineRecipe({
  base: {
    borderRadius: "full",
    textTransform: "none",
    fontWeight: "semibold",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  variants: {
    size: {
      sm: {
        textStyle: "xs",
        px: "8px",
        py: "2px",
      },
      md: {
        textStyle: "sm",
        px: "12px",
        py: "4px",
      },
      lg: {
        textStyle: "md",
        px: "16px",
        py: "6px",
      },
    },

    variant: {
      warning: { bg: "warning.subtle", color: "warning.strong" },
      info: { bg: "info.subtle", color: "info.strong" },
      error: { bg: "error.subtle", color: "error.strong" },
      neutral: { bg: "neutral.subtle", color: "neutral.strong" },
      success: { bg: "success.subtle", color: "success.strong" },
      outline: {
        bg: "transparent",
        borderColor: "#D5D5D5", //TODO: dark-mode Use a variable
        _dark: {
          borderColor: "#2D2D2F", //TODO: dark-mode Use a variable
        },
      },
    },
  },

  defaultVariants: { size: "md" },
})
