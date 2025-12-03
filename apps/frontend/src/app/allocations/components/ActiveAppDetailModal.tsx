"use client"

/* eslint-disable react/no-array-index-key */
import { VStack, Card, HStack, Icon, Heading, Text, Box, Badge, CloseButton } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Flash, Activity } from "iconoir-react"
import { useTranslation } from "react-i18next"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { formatEther } from "viem"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { AppImage } from "@/components/AppImage/AppImage"
import B3TR from "@/components/Icons/svg/b3tr.svg"
import { Modal } from "@/components/Modal"
import { APP_CATEGORIES } from "@/types/appDetails"

import { AppWithVotes } from "../lib/data"

type DataItem = { name: string; value: number }

type SimpleSection = {
  type: "simple"
  icon: typeof Flash | typeof Activity
  label: string
  rows: Array<{ label: string; value: string | number }>
}

type BreakdownSection = {
  type: "breakdown"
  icon: string
  label: string
  breakdownRows: Array<{ label: string; value: string; dotColor: string }>
  chartData: DataItem[]
  chartColors: string[]
  chartPercentage: string
}

type SectionData = SimpleSection | BreakdownSection

const DonutChart = ({ data, colors, percentage }: { data: DataItem[]; colors: string[]; percentage: string }) => {
  return (
    <Box h="70px" w="70px" position="relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={35}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" textAlign="center">
        <Text textStyle="sm" fontWeight="semibold" color="text.default">
          {percentage}
          {"%"}
        </Text>
      </Box>
    </Box>
  )
}

export const ActiveAppDetailModal = ({
  roundId,
  app,
  isOpen,
  onClose,
}: {
  roundId: number
  app: AppWithVotes
  isOpen: boolean
  onClose: VoidFunction
}) => {
  // TODO: add active users of app in that round
  // const { data } = indexerQueryClient.useQuery("get", "/api/v1/b3tr/actions/global/overview", {
  //   params: { query: { roundId } },
  // })
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const votingPowerValue = getCompactFormatter(2).format(Number(formatEther(app.votesReceived, "gwei")))
  const votersCount = app?.voters || 0
  const isCurrentRound = currentRoundId === roundId.toString()

  const {
    rewardsAllocationAmount = 0,
    unallocatedAmount = 0,
    teamAllocationAmount = 0,
    totalAmount = 0,
  } = app?.earnings || {}
  const rewardsToUserPercentage = rewardsAllocationAmount
    ? Math.round((rewardsAllocationAmount * 100) / (rewardsAllocationAmount + unallocatedAmount + teamAllocationAmount))
    : 0

  let dynamicBaseAllocationAmount = totalAmount - (unallocatedAmount + teamAllocationAmount + rewardsAllocationAmount)
  dynamicBaseAllocationAmount = dynamicBaseAllocationAmount > 0 ? dynamicBaseAllocationAmount : 0
  const dynamicBaseAllocationPercentage = (dynamicBaseAllocationAmount * 100) / totalAmount

  const dataList: SectionData[] = [
    {
      type: "simple",
      icon: Flash,
      label: t("Voting power"),
      rows: [
        {
          label: t("Voting power received"),
          value: votingPowerValue,
        },
        {
          label: t("Amount of voters"),
          value: votersCount,
        },
      ],
    },
    {
      type: "breakdown",
      icon: B3TR,
      label: t("B3TR received"),
      breakdownRows: [
        {
          label: t("Voting"),
          value: `${getCompactFormatter(2).format(totalAmount - dynamicBaseAllocationAmount)}`,
          dotColor: "#B3CCFF",
        },
        {
          label: t("Dynamic base"),
          value: `${getCompactFormatter(2).format(dynamicBaseAllocationAmount)}`,
          dotColor: "#004CFC",
        },
      ],
      chartData: isCurrentRound
        ? [
            { name: t("Voting"), value: 1 },
            { name: t("Dynamic base"), value: 0 },
          ]
        : [
            { name: t("Voting"), value: 100 - dynamicBaseAllocationPercentage },
            { name: t("Dynamic base"), value: dynamicBaseAllocationPercentage },
          ],
      chartColors: ["#B3CCFF", "#004CFC"],
      chartPercentage: isCurrentRound ? "0" : (100 - dynamicBaseAllocationPercentage).toFixed(0),
    },
    {
      type: "breakdown",
      icon: B3TR,
      label: t("B3TR distributed"),
      breakdownRows: [
        {
          label: t("To users"),
          value: `${rewardsToUserPercentage}%`,
          dotColor: "#99E0B1",
        },
        {
          label: t("Retained by app"),
          value: `${isCurrentRound ? 0 : 100 - rewardsToUserPercentage}%`,
          dotColor: "#047229",
        },
      ],
      chartData: [
        { name: t("To users"), value: rewardsToUserPercentage },
        { name: t("Retained by app"), value: 100 - rewardsToUserPercentage },
      ],
      chartColors: ["#99E0B1", "#047229"],
      chartPercentage: rewardsToUserPercentage.toString(),
    },
    // {
    //   type: "simple",
    //   icon: Activity,
    //   label: "Activity",
    //   rows: [
    //     {
    //       label: "Active users",
    //       value: "XXX",
    //     },
    //     {
    //       label: "Amount of B3TR actions",
    //       value: "XXX",
    //     },
    //   ],
    // },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} showCloseButton={false}>
      <HStack align="center" justifyContent="space-between">
        <Heading size="xl">{t("Active app details")}</Heading>
        <CloseButton onClick={onClose} />
      </HStack>

      <VStack align="stretch" justifyContent="space-between" my="4">
        <HStack ml="auto">
          <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
            {t("Round") + " " + roundId}
          </Text>
          {isCurrentRound && (
            <Badge size="sm" variant="positive">
              {t("Active")}
            </Badge>
          )}
        </HStack>

        <HStack align="center" gap="4">
          <AppImage appId={app.id} />
          <VStack align="start" gap="1">
            <Heading size="lg">{app.name}</Heading>
            <Badge size="sm" variant="neutral" rounded="sm">
              {APP_CATEGORIES.find(category => category.id === app.metadata?.categories[0])?.name}
            </Badge>
          </VStack>
        </HStack>
      </VStack>

      <VStack mt="4" mb="5" gap="3" align="stretch">
        {dataList.map((section, idx) => (
          <Card.Root key={idx} variant="subtle" _hover={{ bg: "card.subtle" }} border="none" p="4" gap="3">
            <HStack gap="2">
              {typeof section.icon === "string" ? (
                <Box boxSize="4" bg="gray.200" borderRadius="4px" />
              ) : (
                <Icon as={section.icon} boxSize="4" />
              )}
              <Heading size="sm">{section.label}</Heading>
            </HStack>

            {section.type === "simple" && "rows" in section && (
              <VStack gap="2" align="stretch">
                {section.rows.map((row, rowIdx) => (
                  <HStack key={rowIdx} justifyContent="space-between">
                    <Text textStyle="sm" color="text.default">
                      {row.label}
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold">
                      {row.value}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}

            {section.type === "breakdown" && "breakdownRows" in section && (
              <HStack gap="6" alignItems="center" justifyContent="space-between">
                <VStack gap="2" alignItems="center" flex="1">
                  {section.breakdownRows.map((row, rowIdx) => (
                    <HStack key={rowIdx} gap="2" h="5" justifyContent="flex-start" w="full">
                      <Box boxSize="1.5" borderRadius="50%" bg={row.dotColor} flexShrink={0} />
                      <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                        {row.label}
                      </Text>
                      <Text
                        textStyle="sm"
                        fontWeight="semibold"
                        color="text.default"
                        w="46px"
                        textAlign="right"
                        flex={1}>
                        {row.value}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
                <DonutChart
                  data={section.chartData}
                  colors={section.chartColors}
                  percentage={section.chartPercentage}
                />
              </HStack>
            )}
          </Card.Root>
        ))}
      </VStack>
    </Modal>
  )
}
