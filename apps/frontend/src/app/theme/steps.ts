import { defineSlotRecipe } from "@chakra-ui/react"
import { stepsAnatomy } from "@chakra-ui/react/anatomy"

export const stepsSlotRecipe = defineSlotRecipe({
  slots: stepsAnatomy.keys(),
  variants: {
    variant: {
      primaryVertical: {
        indicator: {
          bg: "{colors.actions.secondary.default}",
        },

        separator: {
          "&[data-orientation=vertical]": {
            maxHeight: "calc(100% - var(--steps-size))",
            top: "calc(var(--steps-size))",
            "&[data-complete]": {
              maxHeight: "100%",
              top: "calc(var(--steps-size)/2)",
              zIndex: 1,
            },
          },
        },
      },
    },
  },
})
