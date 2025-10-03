import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    rounded: "full",
    fontWeight: "semibold",
    px: "6",
    py: "3",
    _active: {
      outlineWidth: "2px",
      outlineOffset: "2px",
      outlineStyle: "solid",
      outlineColor: "actions.primary.default",
    },
  },
  variants: {
    variant: {
      primary: {
        color: "actions.primary.text",
        bgColor: "actions.primary.default",
        _hover: { bg: "actions.primary.hover" },
        _disabled: { bg: "actions.primary.disabled" },
        _focus: { bg: "actions.primary.pressed" },
      },
      secondary: {
        color: "actions.secondary.text",
        bgColor: "actions.secondary.default",
        _hover: { bg: "actions.secondary.hover" },
        _disabled: { bg: "actions.secondary.disabled" },
        _focus: { bg: "actions.secondary.pressed" },
      },
      tertiary: {
        color: "actions.tertiary.text",
        bgColor: "actions.tertiary.default",
        _hover: { bg: "actions.tertiary.hover" },
        _disabled: { bg: "actions.tertiary.disabled" },
        _focus: { bg: "actions.tertiary.pressed" },
      },
      subtle: {
        bg: "card.subtle",
        _hover: { bg: "card.hover" },
        _disabled: { bg: "actions.primary.disabled" },
        transition: "background 0.2s ease-in-out",
      },
      ghost: {
        bg: "transparent",
        _hover: { bg: "card.hover" },
        _disabled: { bg: "actions.primary.disabled" },
        transition: "background 0.2s ease-in-out",
      },
    },
  },
})
