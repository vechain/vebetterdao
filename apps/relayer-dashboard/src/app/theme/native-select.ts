import { defineSlotRecipe } from "@chakra-ui/react"
import { nativeSelectAnatomy } from "@chakra-ui/react/anatomy"

export const nativeSelectSlotRecipe = defineSlotRecipe({
  slots: nativeSelectAnatomy.keys(),
  base: { field: { rounded: "full" } },
})
