import { defineSlotRecipe } from "@chakra-ui/react"
import { tabsAnatomy } from "@chakra-ui/react/anatomy"

export const tabsSlotRecipe = defineSlotRecipe({
  slots: tabsAnatomy.keys(),
  variants: {
    variant: {
      line: {
        list: {
          borderColor: "border.secondary",
        },
        trigger: {
          fontWeight: "bold",
          color: "text.subtle",
          _selected: {
            color: "actions.tertiary.default",
            _horizontal: { "--indicator-color": "var(--vbd-colors-actions-tertiary-default)" },
            _vertical: { "--indicator-color": "var(--vbd-colors-actions-tertiary-default)" },
          },
        },
      },
    },
  },
})
