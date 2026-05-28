"use client"

import { Card, HStack, Icon, IconButton, Separator, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { InfoCircle } from "iconoir-react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"

import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { SnapshotExplanationModal } from "@/app/components/Countdown/SnapshotExplanationModal"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"

type Props = {
  mode: "power-up" | "power-down"
  amount: string
  isHighlighted?: boolean
  includeDelegation?: boolean
}

const formatter = getCompactFormatter(2)

export const PowerUpSummary = ({ mode, amount, isHighlighted = false, includeDelegation = false }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: vot3Balance, isLoading: isVot3Loading } = useGetVot3UnlockedBalance(account?.address ?? undefined)
  const { data: bestBlock } = useBestBlockCompressed()
  const { data: currentVotingPower, isLoading: isCurrentVotingPowerLoading } = useTotalVotesOnBlock(
    bestBlock?.number ? Number(bestBlock.number) - 1 : undefined,
    account?.address,
  )
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: delegatedAmount } = useGetDelegatedAmount(isDelegated ? account?.address : undefined)
  const { open: isOpenSnapshot, onOpen: onOpenSnapshot, onClose: onCloseSnapshot } = useDisclosure()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: allocationRound, isLoading: isRoundLoading } = useAllocationsRound(currentRoundId)

  const numericAmount = Number(amount) || 0
  const currentVot3Balance = Number(vot3Balance?.scaled ?? "0")
  const lockedForSupport = Number(currentVotingPower?.depositsVotes ?? "0")
  const currentDelegatedNum = Number(delegatedAmount?.scaled ?? "0")

  const nextRoundVotingPower = isDelegated
    ? includeDelegation
      ? currentDelegatedNum + numericAmount
      : currentDelegatedNum
    : currentVot3Balance + lockedForSupport

  const showsVotingPowerIncrease = mode === "power-up" && (!isDelegated || includeDelegation)
  const sign = mode === "power-up" ? "+" : "-"
  const changeColor = mode === "power-up" ? "status.positive.strong" : "status.negative.strong"

  const summaryLabel =
    mode === "power-up"
      ? isDelegated && !includeDelegation
        ? t("VOT3 added to wallet")
        : t("Voting Power added from next round")
      : t("Voting Power removed from next round")

  return (
    <Card.Root
      w="full"
      p={4}
      bg={isHighlighted ? "status.positive.subtle" : "card.default"}
      border="1px solid"
      borderColor={isHighlighted ? "status.positive.strong" : "border.secondary"}
      rounded="2xl">
      <VStack align="start" gap={2}>
        <Text textStyle="xs" color="text.subtle" fontStyle="italic">
          {summaryLabel}
        </Text>

        <Text textStyle="3xl" fontWeight="bold" color={changeColor}>
          {sign}
          {formatter.format(numericAmount)}
          {" VOT3"}
        </Text>

        <Skeleton loading={isVot3Loading || isCurrentVotingPowerLoading} w="full">
          <VStack align="start" gap={2} w="full">
            {isDelegated && !includeDelegation && mode === "power-up" ? (
              <Text textStyle="xs" color="text.subtle">
                {t("To increase voting power, delegate the converted VOT3 to your navigator.")}
              </Text>
            ) : (
              <>
                {isDelegated && includeDelegation && mode === "power-up" && numericAmount > 0 && (
                  <>
                    <Separator w="full" borderColor="status.positive.strong/30" />
                    <HStack w="full" justifyContent="space-between">
                      <Text textStyle="xs" color="text.subtle">
                        {t("Delegated to navigator")}
                      </Text>
                      <Text textStyle="xs" fontWeight="semibold">
                        {formatter.format(currentDelegatedNum)} {"→"}{" "}
                        {formatter.format(currentDelegatedNum + numericAmount)} {"VOT3"}
                      </Text>
                    </HStack>
                  </>
                )}
                <Separator w="full" borderColor="status.positive.strong/30" />
                <HStack w="full" justifyContent="space-between">
                  <Text textStyle="xs" color="text.subtle">
                    {t("Next round voting power")}
                  </Text>
                  <Text textStyle="xs" fontWeight="semibold">
                    {formatter.format(nextRoundVotingPower)} {"VOT3"}
                  </Text>
                </HStack>
                {!isDelegated && lockedForSupport > 0 && (
                  <Text textStyle="xs" color="text.subtle">
                    {"("}
                    {formatter.format(currentVot3Balance)} {t("in wallet")}
                    {" + "}
                    {formatter.format(lockedForSupport)} {t("in support")}
                    {")"}
                  </Text>
                )}
              </>
            )}
          </VStack>
        </Skeleton>

        {showsVotingPowerIncrease && (
          <Skeleton loading={isRoundLoading} w="full">
            <HStack w="full" justifyContent="space-between">
              <HStack gap={1}>
                <Text textStyle="xs" color="text.subtle">
                  {t("Snapshot in")}
                </Text>
                <IconButton
                  variant="ghost"
                  size="2xs"
                  rounded="full"
                  aria-label={t("What is a snapshot?")}
                  onClick={onOpenSnapshot}>
                  <Icon as={InfoCircle} boxSize="3.5" color="text.subtle" />
                </IconButton>
              </HStack>
              {allocationRound?.voteEndTimestamp && (
                <Countdown
                  date={allocationRound.voteEndTimestamp.toDate()}
                  now={() => Date.now()}
                  renderer={({ days, hours, minutes }) => (
                    <Text textStyle="xs" fontWeight="semibold">
                      {days}
                      {"d "}
                      {hours}
                      {"h "}
                      {minutes}
                      {"m"}
                    </Text>
                  )}
                />
              )}
              <SnapshotExplanationModal isOpen={isOpenSnapshot} onClose={onCloseSnapshot} />
            </HStack>
          </Skeleton>
        )}
      </VStack>
    </Card.Root>
  )
}
