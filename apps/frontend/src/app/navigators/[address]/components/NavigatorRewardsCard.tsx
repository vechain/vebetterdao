"use client"

import { Button, Card, Heading, HStack, IconButton, Link, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuInfo } from "react-icons/lu"

import { useNavigatorFeeStatus } from "@/api/indexer/navigators/useNavigatorFeeStatus"
import { useClaimNavigatorFees } from "@/hooks/navigator/useClaimNavigatorFees"

import { NavigatorFeeChartModal } from "./modals/NavigatorFeeChartModal"
import { NavigatorFeeHistoryModal } from "./modals/NavigatorFeeHistoryModal"
import { NavigatorRewardsInfoModal } from "./modals/NavigatorRewardsInfoModal"

const formatter = getCompactFormatter(2)

type Props = {
  address: string
}

export const NavigatorRewardsCard = ({ address }: Props) => {
  const { t } = useTranslation()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const { totalEarned, totalClaimable, totalLocked, claimableRoundIds, nextUnlock, isLoading } =
    useNavigatorFeeStatus(address)
  const { sendTransaction, isPending } = useClaimNavigatorFees({})

  const hasAnyFees = totalEarned > 0
  const canClaim = totalClaimable > 0

  const handleClaimAll = () => {
    if (!claimableRoundIds.length) return
    sendTransaction({ roundIds: claimableRoundIds })
  }

  if (isLoading) return <Skeleton w="full" h="200px" borderRadius="xl" />

  return (
    <>
      <Card.Root variant="outline" borderRadius="xl" w="full">
        <Card.Body>
          <VStack gap={4} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack gap={2}>
                <Heading size={{ base: "sm", md: "md" }}>{t("Your Rewards")}</Heading>
                <IconButton
                  variant="ghost"
                  size="xs"
                  rounded="full"
                  aria-label="Info"
                  onClick={() => setIsInfoOpen(true)}>
                  <LuInfo />
                </IconButton>
              </HStack>
              {hasAnyFees && (
                <Link
                  textStyle="md"
                  fontWeight="semibold"
                  color="actions.secondary.text-lighter"
                  onClick={() => setIsHistoryOpen(true)}
                  cursor="pointer">
                  {t("History")}
                  <UilArrowUpRight />
                </Link>
              )}
            </HStack>

            {!hasAnyFees ? (
              <Text textStyle="sm" color="fg.muted">
                {t("Fees are earned when your citizens claim their rewards")}
              </Text>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  <VStack align="start" p={4} borderRadius="xl" bg="status.positive.subtle" gap={1}>
                    <Text textStyle="xs" color="fg.muted">
                      {t("Available to Claim")}
                    </Text>
                    <Text textStyle="xl" fontWeight="bold">
                      {formatter.format(totalClaimable)} {"B3TR"}
                    </Text>
                  </VStack>

                  <VStack align="start" p={4} borderRadius="xl" bg="status.warning.subtle" gap={1}>
                    <Text textStyle="xs" color="fg.muted">
                      {t("Currently Locked")}
                    </Text>
                    <Text textStyle="xl" fontWeight="bold">
                      {formatter.format(totalLocked)} {"B3TR"}
                    </Text>
                  </VStack>
                </SimpleGrid>

                <SimpleGrid columns={2} gap={3}>
                  <VStack align="start" gap={0}>
                    <Text textStyle="xs" color="fg.muted">
                      {t("Total Earned")}
                    </Text>
                    <HStack gap={2} align="baseline">
                      <Text textStyle="sm" fontWeight="semibold">
                        {formatter.format(totalEarned)}
                        {" B3TR"}
                      </Text>
                      <Link
                        textStyle="xs"
                        fontWeight="semibold"
                        color="actions.secondary.text-lighter"
                        onClick={() => setIsChartOpen(true)}
                        cursor="pointer">
                        {t("View Details")}
                        <UilArrowUpRight size={16} />
                      </Link>
                    </HStack>
                  </VStack>

                  <VStack align="start" gap={0}>
                    <Text textStyle="xs" color="fg.muted">
                      {t("Next Unlock")}
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold">
                      {nextUnlock
                        ? t("Round {{round}} ({{amount}} B3TR)", {
                            round: nextUnlock.round,
                            amount: formatter.format(nextUnlock.amount),
                          })
                        : t("No pending unlocks")}
                    </Text>
                  </VStack>
                </SimpleGrid>

                {canClaim && (
                  <Button variant="primary" size="sm" onClick={handleClaimAll} loading={isPending} w="full">
                    {t("Claim All {{amount}} B3TR", { amount: formatter.format(totalClaimable) })}
                  </Button>
                )}
              </>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <NavigatorFeeHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} address={address} />
      <NavigatorFeeChartModal isOpen={isChartOpen} onClose={() => setIsChartOpen(false)} address={address} />
      <NavigatorRewardsInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </>
  )
}
