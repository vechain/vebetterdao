import { defineRecipe, defineSlotRecipe } from "@chakra-ui/react"
import { numberInputAnatomy } from "@chakra-ui/react/anatomy"

export const inputRecipe = defineRecipe({
  base: { rounded: "md", bg: "bg.primary" },
  variants: {
    variant: {
      amountInput: {
        variant: "unstyled",
        height: "50px",
        fontSize: { base: "30px", md: "36px" },
        fontWeight: 700,
        _placeholder: {
          color: "gray.500",
        },
        _dark: {
          _placeholder: {
            color: "whiteAlpha.600",
          },
          bg: "transparent",
        },
        bg: "transparent",
      },
    },
  },
})

export const numberInputSlotRecipe = defineSlotRecipe({
  slots: numberInputAnatomy.keys(),
  base: {
    input: {
      rounded: "md",
    },
  },
})

// export const InputStyle: ComponentStyleConfig = {
//   variants: {
//     amountInput: {
//       field: {
//         height: "50px",
//         fontSize: { base: "30px", md: "36px" },
//         fontWeight: 700,
//         variant: "unstyled",
//         _placeholder: {
//           color: "gray.500",
//         },
//         _dark: {
//           _placeholder: {
//             color: "whiteAlpha.600",
//           },
//           bg: "transparent",
//         },
//         bg: "transparent",
//       },
//     },
//   },
// }
