import { ComponentStyleConfig } from "@chakra-ui/react"

export const PopoverStyle: ComponentStyleConfig = {
  parts: ["popper", "content", "header", "body", "footer", "arrow"],
  baseStyle: {
    content: {
      rounded: "2xl",
      border: "none",
      boxShadow: "lg",
      _dark: {
        bg: "#1D1D1D", //TODO: Change to theme color
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
