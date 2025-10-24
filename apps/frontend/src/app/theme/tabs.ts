import { defineSlotRecipe } from "@chakra-ui/react"
import { tabsAnatomy } from "@chakra-ui/react/anatomy"

export const tabsSlotRecipe = defineSlotRecipe({
  slots: tabsAnatomy.keys(),
  base: {
    root: {
      "--indicator-thickness": "3px",
    },
    list: { px: "1", borderColor: "border.secondary" },
    trigger: {
      focusRing: "inside",
      focusRingWidth: "2px",
      focusRingColor: "border.active",
      fontWeight: "semibold",
      _focus: {
        outlineOffset: "-2px",
      },
    },
  },
  variants: {
    variant: {
      line: {
        trigger: {
          color: "text.subtle",
          _hover: {
            _selected: { color: "actions.primary.pressed" },
            color: "text.default",
          },
          _selected: {
            _focus: {
              _horizontal: { "--indicator-thickness": "0" },
              _vertical: { "--indicator-thickness": "0" },
            },
            color: "actions.primary.pressed",
            _horizontal: { "--indicator-color": "var(--vbd-colors-actions-primary-pressed)" },
            _vertical: { "--indicator-color": "var(--vbd-colors-actions-primary-pressed)" },
          },
        },
      },
      subtle: {
        trigger: {
          borderRadius: "full",
          color: "text.subtle",
          _hover: {
            _selected: { color: "colorPalette.text" },
            color: "text.default",
          },
          _selected: {
            bg: "colorPalette.default",
            color: "colorPalette.text",
          },
        },
      },
    },
    size: {
      sm: {
        trigger: {
          fontSize: "xs",
          lineHeight: "4",
        },
      },
      md: {
        trigger: {
          fontSize: "sm",
          lineHeight: "5",
        },
      },
      lg: {
        trigger: {
          fontSize: "md",
          lineHeight: "6",
        },
      },
    },
  },
  compoundVariants: [
    {
      variant: "line",
      size: "sm",
      css: {
        trigger: {
          px: "2",
          py: "1",
        },
      },
    },
    {
      variant: "line",
      size: "md",
      css: {
        trigger: {
          px: "4",
          py: "2",
        },
      },
    },
    {
      variant: "line",
      size: "lg",
      css: {
        trigger: {
          px: "4",
          py: "3",
        },
      },
    },
    {
      variant: "subtle",
      size: "sm",
      css: {
        trigger: {
          px: "3",
          py: "1",
        },
      },
    },
    {
      variant: "subtle",
      size: "md",
      css: {
        trigger: {
          px: "4",
          py: "2",
        },
      },
    },
    {
      variant: "subtle",
      size: "lg",
      css: {
        trigger: {
          px: "4",
          py: "3",
        },
      },
    },
  ],
  defaultVariants: {
    variant: "line",
    size: "md",
  },
})
