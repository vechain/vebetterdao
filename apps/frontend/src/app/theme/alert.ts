import { defineSlotRecipe } from "@chakra-ui/react"
import { alertAnatomy } from "@chakra-ui/react/anatomy"

export const alertSlotRecipe = defineSlotRecipe({
  slots: alertAnatomy.keys(),
  base: {
    root: {
      rounded: "lg",
      border: "sm",
    },
  },
  variants: {
    status: {
      info: {
        root: {
          bg: "status.info.subtle",
          borderColor: "status.info.primary",
          color: "status.info.strong",
        },
        indicator: {
          color: "status.info.strong",
        },
      },
      warning: {
        root: {
          bg: "status.warning.subtle",
          borderColor: "status.warning.primary",
          color: "status.warning.strong",
        },
        indicator: {
          color: "status.warning.strong",
        },
      },
      success: {
        root: {
          bg: "status.positive.subtle",
          borderColor: "status.positive.primary",
          color: "status.positive.strong",
        },
        indicator: {
          color: "status.positive.strong",
        },
      },
      error: {
        root: {
          bg: "status.negative.subtle",
          borderColor: "status.negative.primary",
          color: "status.negative.strong",
        },
        indicator: {
          color: "status.negative.strong",
        },
      },
    },
  },
})
