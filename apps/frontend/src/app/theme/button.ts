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
    primaryGhost: {
      rounded: "full",
      fontSize: "16px",
      fontWeight: 500,
      px: "24px",
      color: "#004CFC",
      bgColor: "transparent",
      _hover: {
        bg: "#004CFC22",
        _disabled: {
          bg: "transparent",
        },
      },
    },
    dangerFilled: {
      rounded: "full",
      fontSize: "16px",
      fontWeight: 500,
      px: "24px",
      color: "#FFFFFF",
      bgColor: "#D23F63",
      _hover: {
        bg: "#cd1e49",
        _disabled: {
          bg: "#D23F63",
        },
      },
    },
    dangerFilledTonal: {
      rounded: "full",
      fontSize: "16px",
      fontWeight: 500,
      px: "24px",
      color: "#D23F63",
      bgColor: "#FCEEF1",
      _hover: {
        bg: "#feccd7",
        _disabled: {
          bg: "#FCEEF1",
        },
      },
    },
    // ICON BUTTON VARIANTS
    // this is strange but seems like icon buttons take the variant from the button
    primaryIconButton: {
      rounded: "full",
      bgColor: "#E0E9FE",
      color: "#004CFC",
      h: "40px",
      w: "40px",
      _hover: {
        bg: "#E0E9FEAA",
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
