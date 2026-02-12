"use client"

import { Card, HStack, Icon, SimpleGrid, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuStar } from "react-icons/lu"
import { PiSquaresFour } from "react-icons/pi"

import { UserNodesInfo } from "../../../api/contracts/xNodes/useGetUserNodes"

type NodesHeroStatsProps = {
  userNodesInfo: UserNodesInfo
}

export const NodesHeroStats = ({ userNodesInfo }: NodesHeroStatsProps) => {
  const { t } = useTranslation()
  const nodes = userNodesInfo.nodesManagedByUser ?? []
  const availablePoints = nodes.reduce((sum, n) => sum + n.availablePoints, 0n)
  const totalOwned = userNodesInfo.totalEndorsementScore ?? 0n
  const pointsInCooldown = nodes.reduce((sum, n) => sum + (n.pointsInCooldown ?? 0n), 0n)
  const endorsedAppsCount = nodes.reduce((count, n) => count + (n.activeEndorsements?.length ?? 0), 0)

  const stats = [
    {
      label: t("Total owned"),
      value: totalOwned.toString(),
      suffix: t("points"),
      icon: LuStar,
      bg: "status.info.subtle",
      color: "status.info.primary",
    },
    {
      label: t("Available to endorse"),
      value: availablePoints.toString(),
      suffix: t("points"),
      icon: LuStar,
      bg: "status.positive.subtle",
      color: "status.positive.primary",
    },

    {
      label: t("In cooldown"),
      value: pointsInCooldown.toString(),
      suffix: t("points"),
      icon: LuStar,
      bg: "status.negative.subtle",
      color: "status.negative.primary",
    },
    {
      label: t("Endorsed apps"),
      value: endorsedAppsCount.toString(),
      suffix: null,
      icon: PiSquaresFour,
      bg: "status.warning.subtle",
      color: "status.warning.primary",
    },
  ]

  return (
    <SimpleGrid columns={{ base: 2, md: 2, lg: 4 }} gap={4}>
      {stats.map(({ label, value, suffix, icon: IconComponent, bg, color }) => (
        <Card.Root key={String(label)} variant="outline" p={4}>
          <Card.Body>
            <Text textStyle="sm" color="text.subtle" mb={2}>
              {String(label)}
            </Text>
            <HStack gap={3}>
              <HStack justify="center" align="center" w="10" h="10" rounded="full" bg={bg} color={color}>
                <Icon as={IconComponent} boxSize={5} />
              </HStack>
              <HStack align="baseline" gap={1} flexWrap="wrap">
                <Text textStyle="xl" fontWeight="bold">
                  {value}
                </Text>
                {suffix && (
                  <Text textStyle="sm" color="text.subtle">
                    {suffix}
                  </Text>
                )}
              </HStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      ))}
    </SimpleGrid>
  )
}
