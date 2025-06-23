import { StyleFunctionProps, createMultiStyleConfigHelpers } from "@chakra-ui/react"
import { modalAnatomy } from "@chakra-ui/anatomy"

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(modalAnatomy.keys)

// define custom styles for modal variant
const variants = {
  base: (props: StyleFunctionProps) =>
    definePartsStyle({
      dialog: {
        bg: props.colorMode === "dark" ? "#2D2D2F" : "white",
        borderWidth: "1px",
        borderColor: props.colorMode === "dark" ? "#2D2D2F" : "transparent",
      },
      overlay: {
        bg: "blackAlpha.600",
      },
    }),
}

// export variants in the component theme
export const ModalStyle = defineMultiStyleConfig({
  variants,
  defaultProps: {
    variant: "base",
  },
  baseStyle: {
    dialog: {
      borderRadius: "16px",
    },
  },
})
