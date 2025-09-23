import { defineRecipe } from "@chakra-ui/react"

export const badgeRecipe = defineRecipe({
  base: {
    borderRadius: "full",
    px: "12px",
    py: "4px",
    textTransform: "none",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  variants: {
    size: {
      sm: {
        fontSize: "12px",
        px: "8px",
        py: "2px",
      },
      md: {
        fontSize: "14px",
        px: "12px",
        py: "4px",
      },
      lg: {
        fontSize: "16px",
        px: "16px",
        py: "6px",
      },
    },

    variant: {
      // Support phase badge (Orange)
      "support-phase": {
        bg: "warning.subtle",
        color: "warning.strong",
      },
      // Approval phase badge (Orange)
      "approval-phase": {
        bg: "warning.subtle",
        color: "warning.strong",
      },
      //In development badge (Yellow)
      "in-development": {
        bg: "info.subtle",
        color: "info.strong",
      },
      // Declined badge (Red)
      declined: {
        bg: "error.subtle",
        color: "error.strong",
      },
      // Completed badge (Gray)
      completed: {
        bg: "neutral.subtle",
        color: "neutral.strong",
      },
      // Approved badge (Green)
      approved: {
        bg: "success.subtle",
        color: "success.strong",
      },
      // Supported badge (Green)
      supported: {
        bg: "success.subtle",
        color: "success.strong",
      },
      outline: {
        bg: "transparent",
        borderColor: "#D5D5D5", //TODO: Use a variable
        _dark: {
          borderColor: "#2D2D2F", //TODO: Use a variable
        },
      },
    },
  },

  defaultVariants: {
    size: "md",
    variant: "support-phase",
  },
})
