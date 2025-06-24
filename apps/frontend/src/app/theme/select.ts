import { ComponentStyleConfig } from "@chakra-ui/react"

export const SelectStyle: ComponentStyleConfig = {
  variants: {
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
      icon: {
        color: "gray.400",
        _dark: {
          color: "gray.300",
        },
      },
    },
  },
  baseStyle: {
    icon: {
      color: "gray.500",
      _dark: {
        color: "gray.200",
      },
    },
  },
  defaultProps: {
    variant: "filled",
  },
}
