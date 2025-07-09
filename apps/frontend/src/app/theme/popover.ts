import { ComponentStyleConfig } from "@chakra-ui/react"

export const PopoverStyle: ComponentStyleConfig = {
  parts: ["popper", "content", "header", "body", "footer", "arrow"],
  baseStyle: {
    content: {
      rounded: "2xl",
      border: "1px solid",
      borderColor: "gray.100",
      boxShadow: "lg",
      _dark: {
        borderColor: "gray.700",
        bg: "gray.800",
      },
    },
    body: {
      p: 2,
    },
    arrow: {
      color: "white",
    },
  },
  defaultProps: {
    placement: "bottom-start",
  },
}
