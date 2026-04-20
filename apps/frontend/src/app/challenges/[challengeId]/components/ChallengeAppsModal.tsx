import { Card, Heading, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"

interface ChallengeAppsModalProps {
  isOpen: boolean
  onClose: () => void
  appIds: string[]
  appNames: Map<string, string>
}

export const ChallengeAppsModal = ({ isOpen, onClose, appIds, appNames }: ChallengeAppsModalProps) => {
  const { t } = useTranslation()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack gap="4" align="stretch">
        <VStack gap="2" align="stretch">
          <Heading textStyle="xl" fontWeight="bold">
            {t("Eligible Apps")} {`(${appIds.length})`}
          </Heading>
          <Text textStyle="sm" color="text.subtle">
            {t(
              "Use any of these apps to perform actions and earn points toward this challenge. Actions on apps not listed here will not count.",
            )}
          </Text>
        </VStack>

        <VStack gap="2" align="stretch">
          {appIds.map(appId => (
            <Card.Root
              key={appId}
              variant="action"
              border="none"
              display="grid"
              gridTemplateColumns="auto 1fr"
              alignItems="center"
              p={{ base: "2", md: "3" }}
              px={{ base: "1", md: "3" }}
              columnGap="4">
              <AppImage appId={appId} boxSize="11" flexShrink={0} shape="square" borderRadius="lg" />
              <Text textStyle={{ base: "md", md: "lg" }} color="text.default" fontWeight="semibold">
                {appNames.get(appId.toLowerCase()) ?? appId}
              </Text>
            </Card.Root>
          ))}
        </VStack>
      </VStack>
    </BaseModal>
  )
}
