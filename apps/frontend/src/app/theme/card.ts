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
      transition: "all 0.2s ease-in-out",
    },
    body: { padding: "0" },
    header: { padding: "0", pb: "4" },
    footer: { padding: "0" },
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
          border: "sm", // 1px
          borderColor: "border.secondary",
          _hover: { bg: "card.hover" },
        },
      },
      action: {
        root: {
          bg: "card.default",
          _hover: { bg: "card.hover" },
          border: "sm",
          borderColor: "border.secondary",
        },
      },
      outline: {
        root: {
          bg: "bg.primary",
          border: "sm",
          borderColor: "border.secondary",
        },
      },
    },
  },
})
