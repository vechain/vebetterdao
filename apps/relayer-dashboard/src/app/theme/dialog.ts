import { defineSlotRecipe } from "@chakra-ui/react"
import { dialogAnatomy } from "@chakra-ui/react/anatomy"

export const dialogSlotRecipe = defineSlotRecipe({
  slots: dialogAnatomy.keys(),
  base: {
    content: {
      borderRadius: "16px",
      bg: "bg.primary",
      borderWidth: "1px",
      borderColor: { base: "transparent", _dark: "#2D2D2F" },
    },
    backdrop: { bg: "blackAlpha.600" },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pt: "6",
      px: "6",
      pb: "0",
      position: "relative",
    },
    body: { px: "6", py: "0" },
    footer: {
      display: "flex",
      gap: "4",
      alignItems: "center",
      justifyContent: "center",
      pt: "4",
      pb: "6",
      px: "6",
    },
    title: {
      color: "text.default",
      textStyle: "3xl",
      fontWeight: "bold",
    },
    description: { color: "text.default", textStyle: "md" },
    closeTrigger: { position: "absolute", top: "6", right: "6" },
  },
  variants: {
    placement: {
      center: { positioner: { justifyContent: "center", alignItems: "center" } },
      top: { positioner: { justifyContent: "center", alignItems: "flex-start" } },
      bottom: { positioner: { justifyContent: "center", alignItems: "flex-end" } },
    },
    size: {
      "2xl": { content: { width: "42rem" } },
      "3xl": { content: { width: "48rem" } },
      "4xl": { content: { width: "56rem" } },
      "5xl": { content: { width: "64rem" } },
      "6xl": { content: { width: "72rem" } },
      "7xl": { content: { width: "80rem" } },
      "8xl": { content: { width: "90rem" } },
    },
  },
  defaultVariants: { placement: "center" },
})
