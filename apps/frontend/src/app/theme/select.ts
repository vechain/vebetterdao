import { defineSlotRecipe } from "@chakra-ui/react"
import { selectAnatomy } from "@chakra-ui/react/anatomy"

export const selectSlotRecipe = defineSlotRecipe({
  slots: selectAnatomy.keys(),
  variants: {
    variant: {
      filled: {
        trigger: {
          color: "text.subtle",
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "gray.200",
          bg: "white",
          _focusVisible: {
            bg: "white",
          },
          _dark: {
            borderColor: "gray.600",
            bg: "white",
          },
        },
        indicatorGroup: {
          color: "gray.400",
          _dark: {
            color: "gray.300",
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: "filled",
  },
})
