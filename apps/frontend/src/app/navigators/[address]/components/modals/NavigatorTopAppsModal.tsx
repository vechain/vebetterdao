"use client"

import { Badge, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AppVotesGiven } from "@/api/contracts/xApps/hooks/useUserTopVotedApps"
import { AppVotedBox } from "@/app/profile/components/ProfileGovernance/components/AppVotedBox"
import { BaseModal } from "@/components/BaseModal"

const PAGE_SIZE = 10

type Props = {
  isOpen: boolean
  onClose: () => void
  apps: AppVotesGiven[]
  description: string
}

export const NavigatorTopAppsModal = ({ isOpen, onClose, apps, description }: Props) => {
  const { t } = useTranslation()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visible = apps.slice(0, visibleCount)
  const hasMore = visibleCount < apps.length

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Most voted apps")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <VStack gap={1} align="start">
          <HStack justify="space-between" w="full">
            <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
              {t("Most voted apps")}
            </Heading>
            <Badge variant="neutral" size="sm" rounded="sm">
              {apps.length}
            </Badge>
          </HStack>
          <Text textStyle="sm" color="text.subtle">
            {description}
          </Text>
        </VStack>

        <VStack gap={3} align="stretch">
          {visible.map(app => (
            <AppVotedBox key={app.appId} appVoted={app} />
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              fontWeight="semibold"
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
              {t("View more")}
            </Button>
          )}
        </VStack>
      </VStack>
    </BaseModal>
  )
}
