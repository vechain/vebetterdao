import { defineSlotRecipe } from "@chakra-ui/react"
import { stepsAnatomy } from "@chakra-ui/react/anatomy"

export const stepsSlotRecipe = defineSlotRecipe({
  slots: stepsAnatomy.keys(),
  variants: {
    variant: {
      primaryVertical: {
        indicator: {
          bg: "#E0E9FE",
          "&[data-complete]": {
            bg: "#E0E9FE",
          },
          "&[data-current]": {
            borderColor: "#E0E9FE",
          },
        },
        separator: {
          "&[data-complete]": {
            bg: "#004CFC",
          },
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
      grants: {
        indicator: {
          w: "24px",
          h: "24px",
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
