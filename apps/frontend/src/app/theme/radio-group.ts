import { defineSlotRecipe } from "@chakra-ui/react"
import { radioGroupAnatomy } from "@chakra-ui/react/anatomy"

export const radioGroupSlotRecipe = defineSlotRecipe({
  slots: radioGroupAnatomy.keys(),
  defaultVariants: {
    variant: "base",
  },
  variants: {
    variant: {
      base: {
        itemControl: {
          borderRadius: "full",
          borderColor: "border.primary",
          borderWidth: "2px",
          bg: "bg",
          _checked: {
            bg: "actions.primary.default",
            borderColor: "actions.primary.default",
          },

          _disabled: {
            borderColor: "border.disabled",
            bg: "bg.disabled",
          },
        },
      },
    },
  },
})
