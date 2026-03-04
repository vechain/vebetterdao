import { defineSlotRecipe } from "@chakra-ui/react"
import { checkboxAnatomy } from "@chakra-ui/react/anatomy"

export const checkboxSlotRecipe = defineSlotRecipe({
  slots: checkboxAnatomy.keys(),
  defaultVariants: { size: "md", variant: "solid" },
  variants: {
    variant: {
      solid: {
        root: {
          display: "flex",
          alignItems: "center",
          gap: "2",
          borderRadius: "4px",
          focusVisibleRing: "outside",
          focusRingColor: "borders.active",
          focusRingWidth: "2px",
          focusRingOffset: "2px",
          focusRingStyle: "solid",
        },
        control: {
          borderRadius: "4px",
          borderColor: "borders.primary",
          borderWidth: "2px",
          bg: "bg.primary",
          cursor: "pointer",
          _hover: { bg: "bg.secondary" },
          _checked: {
            bg: "actions.primary.default",
            color: "white",
            borderColor: "actions.primary.default",
            _hover: { bg: "actions.primary.hover", borderColor: "actions.primary.hover" },
          },
          _disabled: {
            bg: "bg.tertiary",
            borderColor: "borders.secondary",
            cursor: "not-allowed",
            _checked: { bg: "actions.primary.disabled", borderColor: "actions.primary.disabled" },
          },
        },
        label: {
          color: "text.default",
          fontSize: "sm",
          fontWeight: "normal",
          lineHeight: "5",
          cursor: "pointer",
          _disabled: { color: "text.subtle", cursor: "not-allowed" },
        },
      },
    },
    size: {
      sm: { control: { width: "18px", height: "18px" } },
      md: { control: { width: "20px", height: "20px" } },
      lg: { control: { width: "24px", height: "24px" } },
    },
  },
})
