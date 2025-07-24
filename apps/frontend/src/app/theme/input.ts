import { defineRecipe } from "@chakra-ui/react"

export const inputRecipe = defineRecipe({
  variants: {
    variant: {
      amountInput: {
        field: {
          height: "50px",
          fontSize: { base: "30px", md: "36px" },
          fontWeight: 700,
          variant: "unstyled",
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
