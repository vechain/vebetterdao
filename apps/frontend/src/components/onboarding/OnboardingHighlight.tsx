import { Box } from "@chakra-ui/react"
import { type ReactElement } from "react"

interface OnboardingHighlightProps {
  children: ReactElement
  isActive?: boolean
}

export const OnboardingHighlight = ({ children, isActive = false }: OnboardingHighlightProps) => {
  if (!isActive) return children

  return (
    <Box position="relative" zIndex="onboarding.highlight" pointerEvents="none">
      {children}
    </Box>
  )
}
