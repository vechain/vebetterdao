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
      warning: { bg: "status.warning.subtle", color: "status.warning.strong" },
      info: { bg: "status.info.subtle", color: "status.info.strong" },
      error: { bg: "status.negative.subtle", color: "status.negative.strong" },
      neutral: { bg: "status.neutral.subtle", color: "status.neutral.strong" },
      success: { bg: "status.positive.subtle", color: "status.positive.strong" },
      outline: { bg: "transparent", borderColor: "border.secondary" },
    },
  },

  defaultVariants: { size: "md" },
})
