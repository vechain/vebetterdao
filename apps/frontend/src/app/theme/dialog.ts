import { defineSlotRecipe } from "@chakra-ui/react"
import { dialogAnatomy } from "@chakra-ui/react/anatomy"

export const dialogSlotRecipe = defineSlotRecipe({
  slots: dialogAnatomy.keys(),
  variants: {
    variant: {
      base: {
        content: {
          bg: {
            base: "white",
            _dark: "#2D2D2F",
          },
          borderWidth: "1px",
          borderColor: {
            base: "transparent",
            _dark: "#2D2D2F",
          },
        },
        backdrop: {
          bg: "blackAlpha.600",
        },
      },
    },
  },

  base: {
    content: {
      borderRadius: "16px",
    },
  },
})

// // define custom styles for modal variant
// const variants = {
//   base: (props: StyleFunctionProps) =>
//     definePartsStyle({
//       dialog: {
//         bg: props.colorMode === "dark" ? "#2D2D2F" : "white",
//         borderWidth: "1px",
//         borderColor: props.colorMode === "dark" ? "#2D2D2F" : "transparent",
//       },
//       overlay: {
//         bg: "blackAlpha.600",
//       },
//     }),
// }

// // export variants in the component theme
// export const ModalStyle = defineMultiStyleConfig({
//   variants,
//   defaultProps: {
//     variant: "base",
//   },
//   baseStyle: {
//     dialog: {
//       borderRadius: "16px",
//     },
//   },
// })
