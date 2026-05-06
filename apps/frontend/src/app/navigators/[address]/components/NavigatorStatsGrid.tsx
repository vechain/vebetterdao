import { Badge, Card, Flex, HStack, Icon, SimpleGrid, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronRight, LuGauge, LuUsers } from "react-icons/lu"

import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"

const formatter = getCompactFormatter(2)

type Props = {
  navigator: NavigatorEntityFormatted
  onCitizensClick: () => void
  onStakedClick: () => void
  onDelegatedClick: () => void
}

export const NavigatorStatsGrid = ({ navigator: nav, onCitizensClick, onStakedClick, onDelegatedClick }: Props) => {
  const { t } = useTranslation()

  const isAtCapacity = Number(nav.stakeFormatted ?? 0) * 10 <= Number(nav.totalDelegatedFormatted ?? 0)

  const stats = useMemo(
    () => [
      {
        id: "citizens",
        label: t("Citizens"),
        value: String(nav.citizenCount ?? 0),
        icon: LuUsers,
        bg: "status.positive.subtle",
        color: "status.positive.primary",
      },
      {
        id: "delegated",
        label: t("Total Delegated"),
        value: `${formatter.format(Number(nav.totalDelegatedFormatted ?? 0))} VOT3`,
        icon: Vot3Svg,
        bg: "status.info.subtle",
        color: "status.info.primary",
      },
      {
        id: "staked",
        label: t("Total Staked"),
        value: `${formatter.format(Number(nav.stakeFormatted ?? 0))} B3TR`,
        icon: B3trSvg,
        bg: "status.warning.subtle",
        color: "status.warning.primary",
      },
      {
        id: "capacity",
        label: t("Delegation Capacity"),
        value: `${formatter.format(Number(nav.stakeFormatted ?? 0) * 10)} VOT3`,
        icon: LuGauge,
        bg: isAtCapacity ? "status.negative.subtle" : "status.neutral.subtle",
        color: isAtCapacity ? "status.negative.primary" : "status.neutral.primary",
      },
    ],
    [nav, t, isAtCapacity],
  )

  const clickHandlers: Record<string, () => void> = {
    citizens: onCitizensClick,
    staked: onStakedClick,
    delegated: onDelegatedClick,
  }

  return (
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
                  {id === "capacity" && isAtCapacity && (
                    <Badge ml={2} colorPalette="red" size="sm" borderRadius="md">
                      {t("FULL")}
                    </Badge>
                  )}
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
                  <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                    {value}
                  </Text>
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
  )
}
