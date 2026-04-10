"use client"

import { Text, Skeleton, Mark, Badge, Flex } from "@chakra-ui/react"
import { getCompactFormatter, humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { formatEther, parseEther } from "viem"

import { useGetVotesOnBlock } from "@/api/contracts/governance/hooks/useVotesOnBlock"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useCurrentRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"

import { StatCard } from "./StatCard"
import { VotingPowerBottomSheet } from "./VotingPowerBottomSheet"

export const VotingPowerBox = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const onClose = useCallback(() => setIsOpen(false), [])

  const { isMobile } = useBreakpoints()

  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: snapshotBlock } = useCurrentRoundSnapshot()
  const { data: bestBlock } = useBestBlockCompressed()

  // getVotes handles delegation (returns delegated amount) and includes deposits
  const { data: snapshotVotes, isLoading: isSnapshotLoading } = useGetVotesOnBlock(
    snapshotBlock ? Number(snapshotBlock) : undefined,
    account?.address,
  )
  // getPastVotes requires timepoint < block.number, so use bestBlock - 1
  const { data: currentVotes, isLoading: isCurrentLoading } = useGetVotesOnBlock(
    bestBlock?.number ? Number(bestBlock.number) - 1 : undefined,
    account?.address,
  )

  const formatted = snapshotVotes ? (parseEther(snapshotVotes) === 0n ? "0" : humanNumber(snapshotVotes)) : "-"

  const votingPowerNextRound = useMemo(() => {
    if (!snapshotVotes || !currentVotes) return 0n
    return parseEther(currentVotes) - parseEther(snapshotVotes)
  }, [snapshotVotes, currentVotes])

  const allLoading = isSnapshotLoading || isCurrentLoading

  return (
    <>
      <StatCard
        variant="positive"
        title={t("Your voting power")}
        icon={isMobile ? undefined : <Flash />}
        isLoading={allLoading}
        onClick={() => setIsOpen(true)}
        subtitle={
          <Skeleton asChild loading={allLoading}>
            <Flex
              direction={{ base: "row", md: "column" }}
              align={{ base: "center", md: "start" }}
              gap={1}
              flexWrap="wrap">
              <Text textStyle={{ base: "2xl", md: "2xl" }} lineClamp={1}>
                <Mark variant="text" fontWeight="semibold">
                  {formatted}
                </Mark>
              </Text>
              {votingPowerNextRound !== 0n && (
                <Badge
                  variant="neutral"
                  bg="card.subtle"
                  color="text.subtle"
                  fontWeight="normal"
                  size="sm"
                  rounded="md">
                  <Trans
                    parent="span"
                    i18nKey="<bold>{{sign}}{{votingPowerNextRound}}</bold> in next round"
                    values={{
                      sign: votingPowerNextRound > 0n ? "+" : "",
                      votingPowerNextRound: getCompactFormatter(2).format(Number(formatEther(votingPowerNextRound))),
                    }}
                    components={{
                      bold: (
                        <Text
                          key="bold"
                          color={votingPowerNextRound > 0n ? "status.positive.strong" : "status.negative.strong"}
                          as="span"
                        />
                      ),
                    }}
                  />
                </Badge>
              )}
            </Flex>
          </Skeleton>
        }
      />
      <VotingPowerBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        formatted={formatted}
        votingPowerNextRound={votingPowerNextRound}
        isLoading={allLoading}
        isDelegated={isDelegated}
      />
    </>
  )
}
