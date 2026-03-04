import { defineSlotRecipe } from "@chakra-ui/react"
import { popoverAnatomy } from "@chakra-ui/react/anatomy"

export const popoverSlotRecipe = defineSlotRecipe({
  className: "popover",
  slots: popoverAnatomy.keys(),
  base: {
    content: {
      rounded: "2xl",
      border: "none",
      boxShadow: "lg",
      bg: { base: "white", _dark: "bg.primary" },
    },
    body: { p: 2 },
    arrow: { "--arrow-size": "8px" },
    arrowTip: {
      borderTopColor: { base: "white", _dark: "bg.primary" },
      borderInlineStartColor: { base: "white", _dark: "bg.primary" },
    },
  },
  defaultVariants: { size: "md" },
  variants: {
    size: {
      sm: { content: { textStyle: "sm" }, body: { p: 1.5 } },
      md: { content: { textStyle: "md" }, body: { p: 2 } },
      lg: { content: { textStyle: "lg" }, body: { p: 3 } },
    },
  },
})
