"use client"

import { Card, Heading, HStack, Link, useDisclosure } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppRoundOverviews } from "@/api/indexer/actions/useAppRoundOverviews"
import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

import { useXAppMetadata } from "../../../../api/contracts/xApps/hooks/useXAppMetadata"

import { RewardDetailsModal } from "./AppDetailOverview/components/RewardDetailsModal"
import { RewardHistoryChart } from "./AppDetailOverview/components/RewardHistoryChart"

export const AppRewardStatsCard = () => {
  const { appId } = useParams<{ appId: string }>()
  const { t } = useTranslation()
  const { data: appMetadata } = useXAppMetadata(appId ?? "")
  const { open: isModalOpen, onOpen: onOpenModal, onClose: onCloseModal } = useDisclosure()

  const { data: earningsData, isLoading: earningsLoading } = useAppEarnings(appId)

  const roundIds = useMemo(
    () => (earningsData && Array.isArray(earningsData) ? earningsData.map(e => e.roundId) : []),
    [earningsData],
  )
  const { data: overviewData, isLoading: overviewLoading } = useAppRoundOverviews(appId, roundIds)

  const isChartLoading = earningsLoading || (roundIds.length > 0 && overviewLoading)

  return (
    <>
      <Card.Root w="full" variant="primary" gap={4}>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <Heading size="xl">{t("Rewards")}</Heading>
            <Link textStyle="md" fontWeight="semibold" color="actions.secondary.text-lighter" onClick={onOpenModal}>
              {t("More")}
              <UilArrowUpRight />
            </Link>
          </HStack>
        </Card.Header>

        <Card.Body>
          <RewardHistoryChart earningsData={earningsData} overviewData={overviewData} isLoading={isChartLoading} />
        </Card.Body>
      </Card.Root>

      <RewardDetailsModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        distributionStrategy={appMetadata?.distribution_strategy ?? ""}
      />
    </>
  )
}
