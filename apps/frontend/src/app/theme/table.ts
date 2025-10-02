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
          bg: "transparent",
        },
      },
    },
  },
})
