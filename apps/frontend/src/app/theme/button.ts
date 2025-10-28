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
    focusVisibleRing: "outside",
    focusRingColor: "borders.active",
    focusRingWidth: "2px",
    focusRingOffset: "2px",
    focusRingStyle: "solid",
  },
  variants: {
    variant: {
      primary: {
        color: "actions.primary.text",
        bgColor: "actions.primary.default",
        _hover: { bg: "actions.primary.hover" },
        _disabled: {
          bg: "actions.disabled.disabled",
          color: "actions.disabled.text",
        },
        _focus: { bg: "actions.primary.pressed" },
      },
      secondary: {
        color: "actions.secondary.text",
        bgColor: "actions.secondary.default",
        _hover: { bg: "actions.secondary.hover" },
        _disabled: {
          bg: "actions.disabled.disabled",
          color: "actions.disabled.text",
        },
        _focus: { bg: "actions.secondary.pressed" },
      },
      tertiary: {
        color: "text.default",
        // TODO: tertiary button needs to be updated acc. to DS
        // color: "actions.tertiary.text",
        bgColor: "transparent",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "borders.primary",
        _hover: { bg: "actions.tertiary.hover" },
        _disabled: {
          bg: "actions.disabled.disabled",
          color: "actions.disabled.text",
          borderColor: "borders.secondary",
        },
        _focus: { bg: "actions.tertiary.pressed" },
      },
      negative: {
        color: "actions.negative.text",
        bgColor: "actions.negative.default",
        _hover: { bg: "actions.negative.hover" },
        _disabled: {
          bg: "actions.disabled.disabled",
          color: "actions.disabled.text",
        },
        _focus: { bg: "actions.negative.pressed" },
      },
      link: {
        color: "actions.primary.default",
        bgColor: "transparent",
        _hover: { textDecoration: "underline" },
        _disabled: {
          color: "actions.disabled.text",
        },
      },
      subtle: {
        bg: "card.subtle",
        _hover: { bg: "card.hover" },
        _disabled: { bg: "actions.disabled.disabled" },
        transition: "background 0.2s ease-in-out",
      },
      ghost: {
        bg: "transparent",
        _hover: { bg: "card.hover" },
        _disabled: { bg: "actions.disabled.disabled" },
        transition: "background 0.2s ease-in-out",
      },
    },
  },
})
