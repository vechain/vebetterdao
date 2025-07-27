import { defineSlotRecipe } from "@chakra-ui/react"
import { nativeSelectAnatomy } from "@chakra-ui/react/anatomy"

export const nativeSelectSlotRecipe = defineSlotRecipe({
  slots: nativeSelectAnatomy.keys(),
  variants: {
    variant: {
      filled: {
        field: {
          rounded: "full",
          border: "1px solid",
          borderColor: "gray.200",
          bg: "white",
          _focusVisible: {
            bg: "white",
          },
          _dark: {
            borderColor: "gray.600",
            bg: "white",
            color: "gray.800",
          },
        },
        indicator: {
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

// export const SelectStyle: ComponentStyleConfig = {
//   variants: {
//     filled: {
//       field: {
//         rounded: "full",
//         border: "1px solid",
//         borderColor: "gray.200",
//         bg: "white",
//         _focusVisible: {
//           bg: "white",
//         },
//         _dark: {
//           borderColor: "gray.600",
//           bg: "white",
//           color: "gray.800",
//         },
//       },
//       icon: {
//         color: "gray.400",
//         _dark: {
//           color: "gray.300",
//         },
//       },
//     },
//   },
//   baseStyle: {
//     icon: {
//       color: "gray.500",
//       _dark: {
//         color: "gray.200",
//       },
//     },
//   },
//   defaultProps: {
//     variant: "filled",
//   },
// }
