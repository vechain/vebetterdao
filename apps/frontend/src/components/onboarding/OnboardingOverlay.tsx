import { Box, Portal } from "@chakra-ui/react"

interface OnboardingOverlayProps {
  isVisible?: boolean
}

export const OnboardingOverlay = ({ isVisible = false }: OnboardingOverlayProps) => {
  if (!isVisible) return null

  return (
    <Portal>
      <Box position="fixed" inset={0} bg="opacity.200" zIndex="onboarding.overlay" />
    </Portal>
  )
}
