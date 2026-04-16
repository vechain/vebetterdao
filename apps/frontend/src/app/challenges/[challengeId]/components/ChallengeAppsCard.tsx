import { Badge, Card, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { SmartphoneDevice } from "iconoir-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import type { ChallengeDetail } from "@/api/challenges/types"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"

interface ChallengeAppsCardProps {
  challenge: ChallengeDetail
}

export const ChallengeAppsCard = ({ challenge }: ChallengeAppsCardProps) => {
  const { t } = useTranslation()
  const { data: appsData } = useXApps()
  const appNames = useMemo(
    () => new Map((appsData?.allApps ?? []).map(app => [app.id.toLowerCase(), app.name])),
    [appsData?.allApps],
  )

  const appsCount = challenge.allApps ? t("All apps") : String(challenge.selectedApps.length)

  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }} gap="6" height="max-content">
      <Card.Header gap="6" p="0">
        <HStack justifyContent="space-between">
          <Heading as={HStack} size={{ base: "md", md: "lg" }} fontWeight="semibold">
            <Icon as={SmartphoneDevice} boxSize="5" color="icon.default" />
            {t("Apps")}
          </Heading>
          <Badge variant="neutral" size="sm" rounded="sm">
            {appsCount}
          </Badge>
        </HStack>
      </Card.Header>
      <Card.Body p="0">
        {challenge.allApps ? (
          <Text textStyle="sm" color="text.subtle">
            {t("All apps")}
          </Text>
        ) : (
          <VStack gap="2" align="stretch">
            {challenge.selectedApps.map(app => (
              <Card.Root
                key={app}
                variant="action"
                border="none"
                display="grid"
                gridTemplateColumns="auto 1fr"
                alignItems="center"
                p={{ base: "2", md: "3" }}
                px={{ base: "1", md: "3" }}
                columnGap="4">
                <AppImage appId={app} boxSize="11" flexShrink={0} shape="square" borderRadius="lg" />
                <VStack gap="1" alignItems="start">
                  <Text textStyle={{ base: "md", md: "lg" }} color="text.default" fontWeight="semibold">
                    {appNames.get(app.toLowerCase()) ?? humanAddress(app, 6, 4)}
                  </Text>
                </VStack>
              </Card.Root>
            ))}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  )
}
