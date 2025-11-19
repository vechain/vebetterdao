"use client"

import { Box, Button, Card, HStack, Switch, Text, VStack, Link } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Modal } from "@/components/Modal"

interface AutoVoteModalProps {
  isOpen: boolean
  onClose: () => void
  onApply?: (isEnabled: boolean) => void
  defaultEnabled?: boolean
}

const AUTOMATION_DOCS_URL = "https://docs.vebetterdao.org/vebetterdao/automation#service-fee"

export const AutoVoteModal = ({ isOpen, onClose, onApply, defaultEnabled = true }: AutoVoteModalProps) => {
  const { t } = useTranslation()
  const [isAutomationOn, setIsAutomationOn] = useState(defaultEnabled)

  const handleApply = () => {
    if (onApply) {
      onApply(isAutomationOn)
    }
    onClose()
  }

  const handleSkip = () => {
    onApply?.(false)
    onClose()
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
            {t("Auto-vote & claim rewards")}
          </Text>
        </Box>
      }
      illustration="/assets/3d-illustrations/sparkles.webp"
      showCloseButton
      footer={
        <HStack gap={4} w="full">
          <Button variant="secondary" onClick={handleSkip} flex={1}>
            {t("Skip")}
          </Button>
          <Button variant="primary" onClick={handleApply} flex={1}>
            {t("Apply")}
          </Button>
        </HStack>
      }>
      <VStack gap={4} align="stretch" textAlign="left" pt="4">
        <Text textStyle={{ base: "sm", md: "md" }} color="text.default">
          {t("Automate your weekly votes and reward claims — no effort needed, just stay active in the DAO.")}
        </Text>

        <Text textStyle={{ base: "sm", md: "md" }} color="text.default">
          {t("A small")}{" "}
          <Link href={AUTOMATION_DOCS_URL} target="_blank" textDecoration="underline">
            {t("fee")}
          </Link>{" "}
          {t("will be taken from your weekly rewards to cover the service.")}
        </Text>

        <Card.Root variant="outline" p={4} border="sm" borderColor="border.secondary">
          <HStack justify="space-between">
            <Text textStyle={{ base: "md", md: "lg" }} fontWeight="semibold">
              {t("Automation")}
            </Text>
            <Switch.Root
              size="md"
              defaultChecked
              checked={isAutomationOn}
              onCheckedChange={e => setIsAutomationOn(e.checked)}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </Card.Root>

        <Text textStyle="xs" color="text.default" fontWeight="semibold" letterSpacing={0}>
          {t("You can manage it anytime from your profile settings.")}
        </Text>
      </VStack>
    </Modal>
  )
}
