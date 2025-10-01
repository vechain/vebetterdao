import { defineSlotRecipe } from "@chakra-ui/react"
import { tableAnatomy } from "@chakra-ui/react/anatomy"

export const tableSlotRecipe = defineSlotRecipe({
  slots: tableAnatomy.keys(),
  defaultVariants: {
    variant: "base",
  },
  variants: {
    variant: {
      base: {
        cell: {
          // TODO: dark-mode check if this is needed
          bg: "transparent",
        },
      },
    },
  },
})
