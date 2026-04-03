import { Card, Flex, HStack, Icon, SimpleGrid, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { LuShield, LuUsers } from "react-icons/lu"

import { useNavigatorOverview } from "@/api/indexer/navigators/useNavigators"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"

const formatter = getCompactFormatter(2)

export const NavigatorStatsCards = () => {
  const { data: overview } = useNavigatorOverview()

  const stats = [
    {
      label: "Navigators",
      value: String(overview?.activeNavigators ?? 0),
      icon: LuShield,
      bg: "status.info.subtle",
      color: "status.info.primary",
    },
    {
      label: "Citizens",
      value: String(overview?.totalCitizens ?? 0),
      icon: LuUsers,
      bg: "status.positive.subtle",
      color: "status.positive.primary",
    },
    {
      label: "Total Staked",
      value: overview ? `${formatter.format(Number(overview.totalStakedFormatted))} B3TR` : "0",
      icon: B3trSvg,
      bg: "status.warning.subtle",
      color: "status.warning.primary",
    },
    {
      label: "Total Delegated",
      value: overview ? `${formatter.format(Number(overview.totalDelegatedFormatted))} VOT3` : "0",
      icon: Vot3Svg,
      bg: "status.info.subtle",
      color: "status.info.primary",
    },
  ]

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 2, md: 4 }} w="full">
      {stats.map(({ label, value, icon: IconComponent, bg, color }) => (
        <Card.Root key={label} variant="outline" p={{ base: 2, md: 4 }}>
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
                <HStack align="baseline" gap={1} flexWrap="wrap">
                  <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                    {value}
                  </Text>
                </HStack>
              </HStack>
            </Flex>
          </Card.Body>
        </Card.Root>
      ))}
    </SimpleGrid>
  )
}
