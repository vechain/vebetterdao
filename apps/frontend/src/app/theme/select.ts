import { defineSlotRecipe } from "@chakra-ui/react"
import { selectAnatomy } from "@chakra-ui/react/anatomy"

export const selectSlotRecipe = defineSlotRecipe({
  slots: selectAnatomy.keys(),
  variants: {
    variant: {
      ghost: {
        trigger: {
          color: "text.subtle",
          bg: "transparent",
          border: "none",
          _hover: { bg: "card.hover" },
        },
        indicatorGroup: {
          color: "gray.400",
          _dark: {
            color: "gray.300",
          },
        },
        item: {
          _highlighted: {
            bg: "card.hover",
          },
          _selected: {
            bg: "bg.secondary",
          },
          borderRadius: "lg",
        },
      },
      filled: {
        trigger: {
          color: "text.subtle",
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "gray.200",
          bg: "bg.primary",
          _dark: {
            borderColor: "gray.600",
          },
        },
        indicatorGroup: {
          color: "gray.400",
          _dark: {
            color: "gray.300",
          },
        },
        item: {
          _highlighted: {
            bg: "card.hover",
          },
          _selected: {
            bg: "bg.secondary",
          },
          borderRadius: "lg",
        },
        clearTrigger: {
          px: 2,
        },
      },
    },
  },
  defaultVariants: {
    variant: "filled",
  },
})
