import { defineRecipe } from "@chakra-ui/react"

export const badgeRecipe = defineRecipe({
  base: {
    borderRadius: "full",
    px: "12px",
    py: "4px",
    textTransform: "none",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  variants: {
    size: {
      sm: {
        fontSize: "12px",
        px: "8px",
        py: "2px",
      },
      md: {
        fontSize: "14px",
        px: "12px",
        py: "4px",
      },
      lg: {
        fontSize: "16px",
        px: "16px",
        py: "6px",
      },
    },

    variant: {
      // Support phase badge (Orange)
      "support-phase": {
        bg: "#FFF3E5",
        color: "#AF5F00",
        _dark: {
          bg: "rgba(255, 243, 229, 0.1)",
          color: "#F29B32",
        },
      },
      // Approval phase badge (Orange)
      "approval-phase": {
        bg: "#FFF3E5",
        color: "#AF5F00",
        _dark: {
          bg: "rgba(255, 243, 229, 0.1)",
          color: "#F29B32",
        },
      },
      //In development badge (Yellow)
      "in-development": {
        bg: "#E6EEFF",
        color: "#004CFC",
        _dark: {
          bg: "rgba(255, 255, 255, 0.15)",
          color: "#D4E2FF",
        },
      },
      // Declined badge (Red)
      declined: {
        bg: "#FCEEF1",
        color: "#C84968",
        _dark: {
          bg: "rgba(252, 238, 241, 0.1)",
          color: "#EC9BAF",
        },
      },
      // Completed badge (Gray)
      completed: {
        bg: "#EDF2F7",
        color: "#4A5568",
        _dark: {
          bg: "rgba(237, 242, 247, 0.1)",
          color: "#A0AEC0",
        },
      },
      // Approved badge (Green)
      approved: {
        bg: "#E9FDF1",
        color: "#3DBA67",
        _dark: {
          bg: "rgba(233, 253, 241, 0.1)",
          color: "#99E0B1",
        },
      },
      outline: {
        bg: "transparent",
        borderColor: "#D5D5D5", //TODO: Use a variable
        _dark: {
          borderColor: "#2D2D2F", //TODO: Use a variable
        },
      },
    },
  },

  defaultVariants: {
    size: "md",
    variant: "support-phase",
  },
})
