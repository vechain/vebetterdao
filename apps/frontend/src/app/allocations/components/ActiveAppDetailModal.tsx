"use client"

/* eslint-disable react/no-array-index-key */
import { VStack, Card, HStack, Icon, Heading, Text, Box, Badge, CloseButton } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Flash, Activity } from "iconoir-react"
import React from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useTotalXAppEarnings } from "@/api/contracts/dbaPool/hooks/useTotalXAppEarnings"
import { indexerQueryClient } from "@/api/indexer/api"
import { AppImage } from "@/components/AppImage/AppImage"
import B3TR from "@/components/Icons/svg/b3tr.svg"
import { Modal } from "@/components/Modal"
import { ProgressRing } from "@/components/ProgressRing"
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

const DonutChart = ({ colors, percentage }: { colors: string[]; percentage: string }) => {
  return (
    <ProgressRing
      size={70}
      percent={Number(percentage)}
      bgColor={colors[0]}
      fgColor={colors[1]}
      label={
        <Text color="icon.subtle" textStyle="sm">
          {`${percentage}%`}
        </Text>
      }
    />
  )
}

export const ActiveAppDetailModal = ({
  roundId,
  currentRoundId,
  app,
  isOpen,
  onClose,
  percentage,
}: {
  roundId: number
  currentRoundId: number
  app: AppWithVotes
  isOpen: boolean
  onClose: VoidFunction
  percentage: number
}) => {
  const { t } = useTranslation()
  const { data } = indexerQueryClient.useQuery("get", "/api/v1/b3tr/actions/apps/{appId}/overview", {
    params: { path: { appId: app.id }, query: { roundId } },
  })

  const votingPowerValue = getCompactFormatter(2).format(Number(formatEther(app.votesReceived, "gwei")))
  const votersCount = app?.voters || 0
  const isCurrentRound = currentRoundId === roundId

  let {
    rewardsAllocationAmount = 0,
    unallocatedAmount = 0,
    teamAllocationAmount = 0,
    totalAmount = 0,
  } = app?.earnings || {}
  const {
    data: { dbaEarnings, totalEarnings },
  } = useTotalXAppEarnings(roundId.toString(), app.id, percentage ?? 0)
  const rewardsToUserPercentage =
    data?.totalRewardAmount && totalAmount ? Math.round((data?.totalRewardAmount * 100) / totalAmount) : 0

  let dynamicBaseAllocationAmount = totalAmount - (unallocatedAmount + teamAllocationAmount + rewardsAllocationAmount)
  dynamicBaseAllocationAmount = dynamicBaseAllocationAmount > 0 ? dynamicBaseAllocationAmount : 0
  let dynamicBaseAllocationPercentage = (dynamicBaseAllocationAmount * 100) / totalAmount

  if (isCurrentRound) {
    totalAmount = Number(totalEarnings)
    dynamicBaseAllocationAmount = Number(dbaEarnings)
    dynamicBaseAllocationPercentage = (dynamicBaseAllocationAmount * 100) / totalAmount
  }

  const dataList: SectionData[] = [
    {
      type: "simple",
      icon: Flash,
      label: t("Voting power"),
      rows: [
        {
          label: t("Total votes received"),
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
      label: isCurrentRound ? t("Potential B3TR amount to receive") : t("B3TR received"),
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
      chartData: [
        { name: t("Voting"), value: 100 - dynamicBaseAllocationPercentage },
        { name: t("Dynamic base"), value: dynamicBaseAllocationPercentage },
      ],
      chartColors: ["#B3CCFF", "#004CFC"],
      chartPercentage: (100 - dynamicBaseAllocationPercentage).toFixed(0),
    },
    ...(isCurrentRound
      ? []
      : [
          {
            type: "breakdown" as const,
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
                value: `${100 - rewardsToUserPercentage}%`,
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
        ]),
    {
      type: "simple",
      icon: Activity,
      label: "Activity",
      rows: [
        {
          label: "Active users",
          value: data?.totalUniqueUserInteractions ?? 0,
        },
        {
          label: "Amount of B3TR actions",
          value: data?.actionsRewarded ?? 0,
        },
      ],
    },
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
                <DonutChart colors={section.chartColors} percentage={section.chartPercentage} />
              </HStack>
            )}
          </Card.Root>
        ))}
      </VStack>
    </Modal>
  )
}
