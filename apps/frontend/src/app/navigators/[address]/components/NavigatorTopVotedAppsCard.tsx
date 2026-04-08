import { Badge, Button, Card, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { useUserTopVotedApps } from "@/api/contracts/xApps/hooks/useUserTopVotedApps"
import { AppVotedBox } from "@/app/profile/components/ProfileGovernance/components/AppVotedBox"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"
import { EmptyState } from "@/components/ui/empty-state"

import { NavigatorTopAppsModal } from "./modals/NavigatorTopAppsModal"

const PREVIEW_COUNT = 4

type Props = {
  address: string
}

export const NavigatorTopVotedAppsCard = ({ address }: Props) => {
  const { t } = useTranslation()
  const topVotedApps = useUserTopVotedApps(address)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (topVotedApps && topVotedApps.length > 0) {
    return (
      <>
        <Card.Root w="full" variant="primary" h="full">
          <Card.Body>
            <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
              <HStack gap={2} align="center">
                <Text textStyle={{ base: "sm", md: "md" }} fontWeight="bold">
                  {t("Most voted apps")}
                </Text>
                <Badge variant="neutral" size="sm" rounded="sm">
                  {topVotedApps.length}
                </Badge>
              </HStack>
              {topVotedApps.length > PREVIEW_COUNT && (
                <Button variant="ghost" size="sm" fontWeight="semibold" onClick={() => setIsModalOpen(true)}>
                  {t("View all")}
                  <FiArrowUpRight size={16} />
                </Button>
              )}
            </HStack>
            <VStack w="full" gap={3}>
              {topVotedApps.slice(0, PREVIEW_COUNT).map(app => (
                <AppVotedBox key={app.appId} appVoted={app} />
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>

        <NavigatorTopAppsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          apps={topVotedApps}
          description={t("Apps ranked by total votes received from this navigator.")}
        />
      </>
    )
  }

  return (
    <Card.Root variant="primary" w="full" h="full">
      <Card.Body asChild>
        <EmptyState
          title={t("Most voted apps")}
          description={t("{{subject}} top voted apps will appear here.", {
            subject: `${humanAddress(address, 4, 3)}`,
          })}
          icon={
            <Icon boxSize={20} color="actions.secondary.text-lighter">
              <HandPlantIcon color="rgba(117, 117, 117, 1)" />
            </Icon>
          }
        />
      </Card.Body>
    </Card.Root>
  )
}
