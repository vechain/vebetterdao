"use client"

import { Box, Text, VStack, Link } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { Modal } from "@/components/Modal"

interface AutoVoteModalProps {
  isOpen: boolean
  onClose: () => void
}

const AUTOMATION_DOCS_URL = "https://docs.vebetterdao.org/vebetterdao/automation#service-fee"

export const AutoVoteModal = ({ isOpen, onClose }: AutoVoteModalProps) => {
  const { t } = useTranslation()

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
      showCloseButton>
      <VStack gap={4} align="stretch" textAlign="left" p={{ base: "4", md: "6" }}>
        <Text textStyle={{ base: "sm", md: "md" }} color="text.default">
          {t("Automate your weekly votes and reward claims. No effort needed, just stay active in the DAO.")}
        </Text>

        <Text textStyle={{ base: "sm", md: "md" }} color="text.default">
          {t("A 10% service fee applies to your weekly rewards, capped at 100 B3TR.")}{" "}
          <Link href={AUTOMATION_DOCS_URL} target="_blank" textDecoration="underline">
            {t("Learn more")}
          </Link>
        </Text>
      </VStack>
    </Modal>
  )
}
