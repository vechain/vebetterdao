"use client"

import { Card, HStack, Icon, SimpleGrid, Text } from "@chakra-ui/react"
import { ThreeStars, StarSolid } from "iconoir-react"
import { useTranslation } from "react-i18next"
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
  const endorsedAppsCount = nodes.reduce((count, n) => count + (n.activeEndorsements?.length ?? 0), 0)

  const stats = [
    {
      label: t("Total owned"),
      value: totalOwned.toString(),
      suffix: t("points"),
      icon: ThreeStars,
      bg: "status.info.subtle",
      color: "status.info.primary",
    },
    {
      label: t("Available"),
      value: availablePoints.toString(),
      suffix: t("points"),
      icon: StarSolid,
      bg: "status.positive.subtle",
      color: "status.positive.primary",
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
    <SimpleGrid columns={3} gap={{ base: 2, md: 4 }}>
      {stats.map(({ label, value, suffix, icon: IconComponent, bg, color }) => (
        <Card.Root key={String(label)} variant="outline" p={{ base: 2, md: 4 }}>
          <Card.Body>
            <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
              {String(label)}
            </Text>
            <HStack gap={{ base: 2, md: 3 }}>
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
              <HStack align="baseline" gap={1} flexWrap="wrap">
                <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                  {value}
                </Text>
                {suffix && (
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
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
