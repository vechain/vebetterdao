import { defineSlotRecipe } from "@chakra-ui/react"
import { breadcrumbAnatomy } from "@chakra-ui/react/anatomy"

export const breadrumbSlotRecipe = defineSlotRecipe({
  slots: breadcrumbAnatomy.keys(),
  base: {
    list: { color: "text.subtle" },
    item: {
      color: "text.subtle",
      _last: {
        fontWeight: "semibold",
        color: "text.default",
      },
    },
    separator: {
      color: "icon.subtle",
      _icon: { boxSize: { base: "4", md: "5" } },
    },
  },
  variants: {
    size: {
      sm: { list: { gap: "2", textStyle: "sm" } },
      lg: { list: { gap: "2", textStyle: "lg" } },
    },
  },
  defaultVariants: { size: { base: "sm", md: "lg" } },
})
