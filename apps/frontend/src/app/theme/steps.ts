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
      // TODO: dark-mode this should be tokenized
      grants: {
        indicator: {
          w: "6",
          h: "6",
          borderRadius: "full",
          bg: "#EFEFEF",
          color: "#6A6A6A",

          "&[data-complete]": {
            bg: "#E0E9FE",
            color: "#004CFC",
            borderColor: "#004CFC",
          },
          "&[data-current]": {
            bg: "#004CFC",
            color: "#FFFFFF",
          },
        },
      },
    },
  },
})
