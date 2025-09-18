import { defineRecipe } from "@chakra-ui/react"

export const headingRecipe = defineRecipe({
  base: {
    fontWeight: "bold",
    color: "text.default",
  },
  variants: {
    size: {
      md: { textStyle: "md" },
      lg: { textStyle: "lg" },
      xl: { textStyle: "xl" },
      "2xl": { textStyle: "2xl" },
      "3xl": { textStyle: "3xl" },
      "4xl": { textStyle: "4xl" },
      "5xl": { textStyle: "5xl" },
      "6xl": { textStyle: "6xl" },
    },
  },
  defaultVariants: { size: "xl" },
})
