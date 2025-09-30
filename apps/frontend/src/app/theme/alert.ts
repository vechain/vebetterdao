import { defineSlotRecipe } from "@chakra-ui/react"

export const alertSlotRecipe = defineSlotRecipe({
  slots: ["root", "indicator", "title", "description"],
  base: {
    root: {
      borderRadius: "8px",
      border: "1px solid",
      my: 3,
      p: 4,
      display: "flex",
      flexDirection: "column",
      gap: 3,
    },
    indicator: {
      boxSize: 7,
      flexShrink: 0,
    },
    title: {
      fontWeight: 600,
      fontSize: "md",
    },
  },
  variants: {
    status: {
      warning: {
        root: {
          bg: "warning.subtle",
          borderColor: "warning.primary",
        },
        indicator: {
          color: "warning.strong",
        },
        title: {
          color: "warning.strong",
        },
      },
      error: {
        root: {
          bg: "error.subtle",
          borderColor: "error.primary",
        },
        indicator: {
          color: "error.strong",
        },
        title: {
          color: "error.strong",
        },
      },
      success: {
        root: {
          bg: "success.subtle",
          borderColor: "success.primary",
        },
        indicator: {
          color: "success.strong",
        },
        title: {
          color: "success.strong",
        },
      },
      info: {
        root: {
          bg: "info.subtle",
          borderColor: "info.primary",
        },
        indicator: {
          color: "info.strong",
        },
        title: {
          color: "info.strong",
        },
      },
    },
  },
  defaultVariants: {
    status: "info",
  },
})
