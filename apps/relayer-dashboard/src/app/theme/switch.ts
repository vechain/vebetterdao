import { defineSlotRecipe } from "@chakra-ui/react"
import { switchAnatomy } from "@chakra-ui/react/anatomy"

export const switchSlotRecipe = defineSlotRecipe({
  slots: switchAnatomy.keys(),
  defaultVariants: { size: "md", variant: "solid" },
  variants: {
    variant: {
      solid: {
        control: {
          bg: "borders.secondary",
          _checked: { bg: "actions.primary.default" },
        },
      },
    },
    size: {
      sm: { root: { gap: "2" }, label: { fontSize: "sm" } },
      md: { root: { gap: "3" }, label: { fontSize: "md" } },
      lg: { root: { gap: "3" }, label: { fontSize: "lg" } },
    },
  },
})
