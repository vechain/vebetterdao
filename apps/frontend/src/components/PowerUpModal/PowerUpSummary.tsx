"use client"

import { Card, HStack, Skeleton, Text, VStack, useDisclosure, Button } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { SnapshotExplanationModal } from "@/app/components/Countdown/SnapshotExplanationModal"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

type Props = {
  mode: "power-up" | "power-down"
  amount: string
  isHighlighted?: boolean
}

const formatter = getCompactFormatter(2)

export const PowerUpSummary = ({ mode, amount, isHighlighted = false }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: vot3Balance, isLoading: isVot3Loading } = useGetVot3Balance(account?.address ?? undefined)
  const { open: isOpenSnapshot, onOpen: onOpenSnapshot, onClose: onCloseSnapshot } = useDisclosure()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: allocationRound, isLoading: isRoundLoading } = useAllocationsRound(currentRoundId)

  const numericAmount = Number(amount) || 0
  const currentVotingPower = Number(vot3Balance?.scaled ?? "0")
  const sign = mode === "power-up" ? "+" : "-"
  const changeColor = mode === "power-up" ? "status.positive.strong" : "status.negative.strong"

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
          {mode === "power-up" ? t("Voting Power added from next round") : t("Voting Power removed from next round")}
        </Text>

        <Text textStyle="3xl" fontWeight="bold" color={changeColor}>
          {sign}
          {formatter.format(numericAmount)}
          {" VOT3"}
        </Text>

        <VStack gap={0} align="start">
          <Skeleton loading={isVot3Loading}>
            <HStack gap={1}>
              <Text textStyle="sm" color="text.subtle">
                {t("Current Voting Power:")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {formatter.format(currentVotingPower)} {"VOT3"}
              </Text>
            </HStack>
          </Skeleton>

          <Skeleton loading={isRoundLoading}>
            <HStack gap={1}>
              <Text textStyle="sm" color="text.subtle">
                {t("Snapshot in:")}
              </Text>
              {allocationRound?.voteEndTimestamp && (
                <Countdown
                  date={allocationRound.voteEndTimestamp.toDate()}
                  now={() => Date.now()}
                  renderer={({ days, hours, minutes }) => (
                    <Text textStyle="sm" fontWeight="semibold">
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
            </HStack>
            <HStack>
              <Button p="0" variant="link" onClick={onOpenSnapshot}>
                {t("Learn more")}
              </Button>
              <SnapshotExplanationModal isOpen={isOpenSnapshot} onClose={onCloseSnapshot} />
            </HStack>
          </Skeleton>
        </VStack>
      </VStack>
    </Card.Root>
  )
}
