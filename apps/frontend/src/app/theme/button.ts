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
      bgColor: "rgba(0, 76, 252, 1)",
      _hover: {
        bg: "#0038b5",
        _disabled: {
          bg: "rgba(0, 76, 252, 0.7)",
        },
      },
    },
    secondary: {
      rounded: "full",
      color: "rgba(0, 76, 252, 1)",
      bgColor: "rgba(224, 233, 254, 1)",
      _hover: {
        bg: "#7b818e",
        _disabled: {
          bg: "rgba(224, 233, 254, 0.7)",
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
