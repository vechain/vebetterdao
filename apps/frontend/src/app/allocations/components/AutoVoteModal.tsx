"use client"

import { Box, Button, Card, HStack, Switch, Text, VStack, Link, useDisclosure } from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { Modal } from "@/components/Modal"

interface AutoVoteModalProps {
  isOpen?: boolean
  onClose?: () => void
  onApply?: (isEnabled: boolean) => void
  defaultEnabled?: boolean
  autoOpen?: boolean
}

/**
 * If controlledIsOpen is provided, this will open the modal automatically when the component is mounted
 * Example:
 * <AutoVoteModal autoOpen />
 *
 * If controlledOnClose is provided, this will close the modal when the onClose function is called
 * Example:
 * const { open, onOpen, onClose } = useDisclosure()
 * <AutoVoteModal isOpen={open} onClose={onClose} />
 */
export const AutoVoteModal = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onApply,
  defaultEnabled = true,
  autoOpen = false,
}: AutoVoteModalProps) => {
  const { t } = useTranslation()
  const [isAutomationOn, setIsAutomationOn] = useState(defaultEnabled)
  const disclosure = useDisclosure()
  const AUTOMATION_DOCS_URL = "https://docs.vebetterdao.org/vebetterdao/automation#service-fee"

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : disclosure.open
  const onClose = controlledOnClose || disclosure.onClose

  useEffect(() => {
    if (autoOpen && !disclosure.open) {
      disclosure.onOpen()
    }
  }, [autoOpen, disclosure])

  const handleApply = () => {
    // Pass the auto-voting status to the parent component
    // The parent will handle the rest of the flow (storing preferences and enabling auto-voting)
    if (onApply) {
      onApply(isAutomationOn)
    }
    onClose()
  }

  const handleSkip = () => {
    setIsAutomationOn(false)
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
            <Text textStyle="md" fontWeight="semibold">
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
