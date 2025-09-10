import { defineSlotRecipe } from "@chakra-ui/react"
import { cardAnatomy } from "@chakra-ui/react/anatomy"

export const cardSlotRecipe = defineSlotRecipe({
  slots: cardAnatomy.keys(),
  base: {
    root: {
      px: "6",
      py: "4",
      borderRadius: "2xl",
      rounded: "xl",
      border: "0",
    },
    body: { p: "0" },
    footer: { p: "0" },
  },

  variants: {
    variant: {
      primary: {
        root: {
          bg: "bg.primary",
          borderWidth: "1px",
          borderColor: "border.secondary",
        },
      },
    },
  },

  // variants: {
  //   variant: {
  //     primary: {
  //       root: {
  //         bg: "bg.primary",
  //         borderWidth: "1px",
  //         borderColor: "border.secondary",
  //       },
  //     },

  //     info: {
  //       root: {
  //         w: "full",
  //         h: "full",
  //         borderRadius: "xl",
  //         flexDirection: "row",
  //         alignItems: "center",
  //         gap: "1",
  //         overflow: "hidden",
  //         bg: "banner.blue",
  //         minH: { base: "30vh", md: "auto" },
  //         px: "6",
  //         py: "4",
  //       },
  //       title: {
  //         textStyle: "sm",
  //         color: "status.info.strong",
  //       },
  //       description: {
  //         textStyle: "2xl",
  //         color: "text.default",
  //       },
  //       body: {
  //         p: 0,
  //         justifyContent: "center",
  //       },
  //       footer: { p: 0 },
  //     },

  //     base: {
  //       root: {
  //         bg: {
  //           base: "#FFF",
  //           _dark: "#1A1A1A",
  //         },
  //         borderWidth: "1px",
  //         borderColor: {
  //           base: "transparent",
  //           _dark: "#2D2D2F",
  //         },
  //       },
  //       body: {
  //         padding: "24px",
  //       },
  //     },
  //     filled: {
  //       root: {
  //         bg: {
  //           base: "#F8F8F8",
  //           _dark: "#2D2D2F",
  //         },
  //       },
  //       body: {
  //         padding: "24px",
  //       },
  //     },
  //     filledSmall: {
  //       root: {
  //         bg: {
  //           base: "#F8F8F8",
  //           _dark: "#2D2D2F",
  //         },
  //       },
  //       body: {
  //         padding: "12px",
  //       },
  //     },
  //     filledWithBorder: {
  //       root: {
  //         bg: {
  //           base: "#FAFAFA",
  //           _dark: "#2D2D2F",
  //         },
  //         borderWidth: "1px",
  //         borderColor: {
  //           base: "#D5D5D5",
  //           _dark: "#D5D5D5",
  //         },
  //       },
  //       body: {
  //         padding: "24px",
  //       },
  //     },
  //     baseWithBorder: {
  //       root: {
  //         bg: "bg.tertiary",
  //         borderWidth: "1px",
  //         borderColor: "border.primary",
  //       },
  //     },
  //     primaryBoxShadow: {
  //       root: {
  //         border: "1px solid #004CFC",
  //         boxShadow: "0px 0px 16px 0px rgba(0, 76, 252, 0.35)",
  //       },
  //       body: {
  //         padding: "24px",
  //       },
  //     },
  //     secondaryBoxShadow: {
  //       root: {
  //         boxShadow: "inset 0px 0px 100px 5px rgba(177, 241, 108, 1)",
  //         bg: {
  //           base: "#FFF",
  //           _dark: "#1A1A1A",
  //         },
  //         borderWidth: "1px",
  //         borderColor: {
  //           base: "#2D2D2F",
  //           _dark: "#2D2D2F",
  //         },
  //       },
  //       body: {
  //         padding: "24px",
  //       },
  //     },
  //   },
  // },
  // compoundVariants: [
  //   {
  //     visual: "banner-blue",
  //   },
  // ],
})

// // define custom styles for funky variant
// const variants = {
//   // base: (props: StyleFunctionProps) =>
//   //   definePartsStyle({
//   //     container: {
//   //       bg: props.colorMode === "dark" ? "#1A1A1A" : "#FFF",
//   //       borderWidth: "1px",
//   //       borderColor: props.colorMode === "dark" ? "#2D2D2F" : "transparent",
//   //     },
//   //     body: {
//   //       padding: "24px",
//   //     },
//   //   }),
//   filled: (props: StyleFunctionProps) =>
//     definePartsStyle({
//       container: {
//         bg: props.colorMode === "dark" ? "#2D2D2F" : "#F8F8F8",
//       },
//       body: {
//         padding: "24px",
//       },
//     }),
//   filledSmall: (props: StyleFunctionProps) =>
//     definePartsStyle({
//       container: {
//         bg: props.colorMode === "dark" ? "#2D2D2F" : "#F8F8F8",
//       },
//       body: {
//         padding: "12px",
//       },
//     }),
//   filledWithBorder: (props: StyleFunctionProps) =>
//     definePartsStyle({
//       container: {
//         bg: props.colorMode === "dark" ? "#2D2D2F" : "#FAFAFA",
//         borderWidth: "1px",
//         borderColor: props.colorMode === "dark" ? "#D5D5D5" : "#D5D5D5",
//       },
//       body: {
//         padding: "24px",
//       },
//     }),
//   baseWithBorder: (props: StyleFunctionProps) =>
//     definePartsStyle({
//       container: {
//         bg: props.colorMode === "dark" ? "#1E1E1E" : "#FFF",
//         borderWidth: "1px",
//         borderColor: props.colorMode === "dark" ? "#2D2D2F" : "#D5D5D5",
//       },
//       body: {
//         padding: "24px",
//       },
//     }),
//   primaryBoxShadow: () =>
//     definePartsStyle({
//       container: {
//         border: "1px solid #004CFC",
//         boxShadow: "0px 0px 16px 0px rgba(0, 76, 252, 0.35)",
//       },
//       body: {
//         padding: "24px",
//       },
//     }),
//   secondaryBoxShadow: (props: StyleFunctionProps) =>
//     definePartsStyle({
//       container: {
//         boxShadow: "inset 0px 0px 100px 5px rgba(177, 241, 108, 1)",
//         bg: props.colorMode === "dark" ? "#1A1A1A" : "#FFF",
//         borderWidth: "1px",
//         borderColor: props.colorMode === "dark" ? "#2D2D2F" : "gray.100",
//       },
//       body: {
//         padding: "24px",
//       },
//     }),
// }

// // export variants in the component theme
// export const cardTheme = defineMultiStyleConfig({
//   variants,
//   defaultProps: {
//     variant: "base", // default is solid
//   },
//   baseStyle: {
//     container: {
//       borderRadius: "16px",
//     },
//   },
// })
