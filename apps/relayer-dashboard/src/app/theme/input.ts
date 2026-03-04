import { defineRecipe, defineSlotRecipe } from "@chakra-ui/react"
import { numberInputAnatomy } from "@chakra-ui/react/anatomy"

export const inputRecipe = defineRecipe({
  base: { rounded: "md", bg: "bg.primary", borderColor: "border.primary" },
  variants: {
    variant: {
      outline: { borderColor: "border.primary" },
    },
  },
})

export const numberInputSlotRecipe = defineSlotRecipe({
  slots: numberInputAnatomy.keys(),
  base: { input: { rounded: "md" } },
})
