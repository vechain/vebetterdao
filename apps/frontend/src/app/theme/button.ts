import { ComponentStyleConfig } from "@chakra-ui/react"

export const ButtonStyle: ComponentStyleConfig = {
  // style object for base or default style
  baseStyle: {},
  // styles for different sizes ("sm", "md", "lg")
  sizes: {},
  // styles for different visual variants ("outline", "solid")
  variants: {
    primarySubtle: {
      bg: "rgba(224, 233, 254, 1)",
      color: "primary.500",
      _hover: {
        bg: "rgba(224, 233, 254, 0.8)",
      },
    },
    primaryAction: {
      rounded: "full",
      fontSize: "16px",
      fontWeight: 500,
      px: "24px",
      color: "#FFFFFF",
      bgColor: "#004CFC",
      _hover: {
        bg: "#0035b1",
        _disabled: {
          bg: "#004CFC",
        },
      },
    },
  },
  // default values for 'size', 'variant' and 'colorScheme'
  defaultProps: {
    size: "md",
    rounded: "full",
    variant: "solid",
  },
}
