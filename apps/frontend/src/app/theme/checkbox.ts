import { defineSlotRecipe } from "@chakra-ui/react"
import { checkboxAnatomy } from "@chakra-ui/react/anatomy"

export const checkboxSlotRecipe = defineSlotRecipe({
  slots: checkboxAnatomy.keys(),
  defaultVariants: {
    variant: "base",
  },
  variants: {
    variant: {
      base: {
        control: {
          borderRadius: "4px",
          borderColor: "border.primary",
          borderWidth: "2px",
          _checked: {
            bg: "actions.primary.default",
            borderColor: "actions.primary.default",
          },
        },
      },
    },
  },
})
