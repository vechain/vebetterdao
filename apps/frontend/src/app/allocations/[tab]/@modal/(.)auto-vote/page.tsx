"use client"

import { Box, Button, Card, HStack, Portal, Switch, Text, VStack, Link } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Modal } from "@/components/Modal"

const AUTOMATION_DOCS_URL = "https://docs.vebetterdao.org/vebetterdao/automation#service-fee"

export default function AutoVoteModalRoute() {
  const router = useRouter()
  const { t } = useTranslation()
  const [isAutomationOn, setIsAutomationOn] = useState(true)

  const handleApply = () => {
    // @TODO: Implement auto-vote apply logic with isAutomationOn value
    router.back()
  }

  const handleSkip = () => {
    router.back()
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <Portal>
      <Box
        pos="fixed"
        inset={0}
        bg="blackAlpha.600"
        zIndex={1000}
        onClick={handleClose}
        display="flex"
        alignItems="center"
        justifyContent="center">
        <Box onClick={e => e.stopPropagation()} maxW="md" w="full" px={4}>
          <Modal
            isOpen={true}
            onClose={handleClose}
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
        </Box>
      </Box>
    </Portal>
  )
}
