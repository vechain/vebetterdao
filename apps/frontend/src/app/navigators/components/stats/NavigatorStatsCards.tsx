import { Card, Flex, HStack, Icon, SimpleGrid, Skeleton, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronRight, LuBadgeCheck, LuUsers } from "react-icons/lu"

import { useNavigatorOverview } from "@/api/indexer/navigators/useNavigators"
import { NavigatorDelegationsModal } from "@/app/navigators/[address]/components/modals/NavigatorDelegationsModal"
import { NavigatorStakeHistoryModal } from "@/app/navigators/[address]/components/modals/NavigatorStakeHistoryModal"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"

const formatter = getCompactFormatter(2)

export const NavigatorStatsCards = () => {
  const { t } = useTranslation()
  const { data: overview, isLoading } = useNavigatorOverview()
  const [isStakeHistoryOpen, setIsStakeHistoryOpen] = useState(false)
  const [isDelegationsOpen, setIsDelegationsOpen] = useState(false)

  const stats = useMemo(
    () => [
      {
        id: "navigators",
        label: t("Navigators"),
        value: String(overview?.activeNavigators ?? 0),
        icon: LuBadgeCheck,
        bg: "status.info.subtle",
        color: "status.info.primary",
      },
      {
        id: "citizens",
        label: t("Citizens"),
        value: String(overview?.totalCitizens ?? 0),
        icon: LuUsers,
        bg: "status.positive.subtle",
        color: "status.positive.primary",
      },
      {
        id: "total-staked",
        label: t("Total Staked"),
        value: overview ? `${formatter.format(Number(overview.totalStakedFormatted))} ${t("B3TR")}` : "0",
        icon: B3trSvg,
        bg: "status.warning.subtle",
        color: "status.warning.primary",
      },
      {
        id: "total-delegated",
        label: t("Total Delegated"),
        value: overview ? `${formatter.format(Number(overview.totalDelegatedFormatted))} ${t("VOT3")}` : "0",
        icon: Vot3Svg,
        bg: "status.info.subtle",
        color: "status.info.primary",
      },
    ],
    [overview, t],
  )

  const clickHandlers: Record<string, () => void> = {
    "total-staked": () => setIsStakeHistoryOpen(true),
    "total-delegated": () => setIsDelegationsOpen(true),
  }

  return (
    <>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 2, md: 4 }} w="full">
        {stats.map(({ id, label, value, icon: IconComponent, bg, color }) => {
          const isClickable = id in clickHandlers

          return (
            <Card.Root
              key={id}
              variant="outline"
              p={{ base: 2, md: 4 }}
              flexDirection={isClickable ? "row" : undefined}
              alignItems={isClickable ? "center" : undefined}
              cursor={isClickable ? "pointer" : undefined}
              _hover={isClickable ? { borderColor: "border.emphasized" } : undefined}
              onClick={clickHandlers[id]}>
              <Card.Body flex={1}>
                <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                    {label}
                  </Text>
                  <HStack gap={{ base: 2, md: 3 }}>
                    {IconComponent && (
                      <HStack
                        justify="center"
                        align="center"
                        w={{ base: "7", md: "10" }}
                        h={{ base: "7", md: "10" }}
                        rounded="full"
                        bg={bg}
                        color={color}
                        flexShrink={0}>
                        <Icon as={IconComponent} boxSize={{ base: 4, md: 5 }} />
                      </HStack>
                    )}
                    <Skeleton loading={isLoading}>
                      <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                        {value}
                      </Text>
                    </Skeleton>
                  </HStack>
                </Flex>
              </Card.Body>
              {isClickable && (
                <Icon boxSize={{ base: "4", md: "5" }} color="text.subtle" flexShrink={0}>
                  <LuChevronRight />
                </Icon>
              )}
            </Card.Root>
          )
        })}
      </SimpleGrid>

      <NavigatorStakeHistoryModal isOpen={isStakeHistoryOpen} onClose={() => setIsStakeHistoryOpen(false)} />
      <NavigatorDelegationsModal isOpen={isDelegationsOpen} onClose={() => setIsDelegationsOpen(false)} />
    </>
  )
}
