import { defineSlotRecipe } from "@chakra-ui/react"
import { cardAnatomy } from "@chakra-ui/react/anatomy"

export const cardSlotRecipe = defineSlotRecipe({
  slots: cardAnatomy.keys(),
  base: {
    root: {
      px: "6",
      py: "4",
      borderRadius: "2xl",
      rounded: "xl",
      border: "0",
    },
    body: { p: "0" },
    header: { p: "0", pb: "4" },
    footer: { p: "0" },
  },

  variants: {
    variant: {
      primary: {
        root: {
          bg: "bg.primary",
          border: "sm", // 1px
          borderColor: "border.secondary",
        },
      },
      subtle: {
        root: {
          bg: "card.subtle",
          _hover: { bg: "card.hover" },
          transition: "all 0.2s ease-in-out",
        },
      },
    },
  },
})
