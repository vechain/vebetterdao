import { defineSlotRecipe } from "@chakra-ui/react"
import { stepsAnatomy } from "@chakra-ui/react/anatomy"

export const stepsSlotRecipe = defineSlotRecipe({
  slots: stepsAnatomy.keys(),
  defaultVariants: {
    variant: "primaryVertical",
  },
  variants: {
    variant: {
      primaryVertical: {
        indicator: {
          bg: "#E0E9FE",
          "&[data-status=complete]": {
            bg: "#E0E9FE",
          },
          "&[data-status=active]": {
            borderColor: "#E0E9FE",
          },
        },
        separator: {
          "&[data-status=complete]": {
            bg: "#004CFC",
          },
          "&[data-orientation=vertical]": {
            maxHeight: "calc(100% - var(--steps-size))",
            top: "calc(var(--steps-size))",
            "&[data-status=complete]": {
              maxHeight: "100%",
              top: "var(--steps-size)",
              zIndex: 1,
            },
          },
        },
      },
    },
  },
})

// export const StepperStyle: ComponentStyleConfig = {
//   // styles for different visual variants ("outline", "solid")
//   variants: {
//     primaryVertical: {
//       indicator: {
//         bg: "#E0E9FE",
//         "&[data-status=complete]": {
//           bg: "#E0E9FE",
//         },
//         "&[data-status=active]": {
//           borderColor: "#E0E9FE",
//         },
//       },
//       separator: {
//         "&[data-status=complete]": {
//           bg: "#004CFC",
//         },
//         "&[data-orientation=vertical]": {
//           maxHeight: "calc(100% - var(--steps-gutter))",
//           top: "calc(var(--steps-gutter))",
//           "&[data-status=complete]": {
//             maxHeight: "100%",
//             top: "calc(var(--steps-gutter)/2)",
//             zIndex: 1,
//           },
//         },
//       },
//     },
//   },
// }
