"use client"

import { Box, Button, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { Modal } from "@/components/Modal"
import { useBreakpoints } from "@/hooks/useBreakpoints"

interface NavigatorsIntroModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NavigatorsIntroModal = ({ isOpen, onClose }: NavigatorsIntroModalProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isMobile } = useBreakpoints()

  const handleFindNavigator = () => {
    onClose()
    router.push("/navigators")
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <Box textAlign="center" color="text.default">
          <Text textStyle={{ base: "xl", md: "3xl" }} fontWeight="bold">
            {t("New feature!")}
          </Text>
          <Text textStyle={{ base: "xl", md: "3xl" }} fontWeight="bold">
            {t("Delegate to Navigator")}
          </Text>
        </Box>
      }
      illustration="/assets/mascot/navigator-b3mo.png"
      illustrationSize={{ base: "48", md: "48" }}
      showCloseButton={!isMobile}
      footer={
        <VStack w="full" gap="2">
          <Button w="full" onClick={handleFindNavigator}>
            {t("Find a navigator")}
          </Button>
          <Button w="full" variant="ghost" onClick={onClose}>
            {t("Maybe later")}
          </Button>
        </VStack>
      }>
      <VStack gap={4} align="stretch" textAlign="left" p={{ base: "4", md: "6" }}>
        <Text textStyle={{ base: "sm", md: "md" }} color="text.default">
          {t(
            "Engaged community members who vote on your behalf—with public rationale, merit-based judgment, and skin in the game. Delegate your VOT3 to a strategy you trust instead of lazy voting.",
          )}
        </Text>
      </VStack>
    </Modal>
  )
}
