import { useAllocationsRound, useHasVotedInRound, useUserVotesInRound, useTotalVotesOnBlock } from "@/api"
import { Button, Card, HStack, Heading, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useMemo } from "react"
import { AppVotesBreakdown, AppVotesBreakdownProps } from "../AppVotesBreakdown/AppVotesBreakdown"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import BigNumber from "bignumber.js"
import { scaledDivision } from "@/utils/MathUtils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { Trans } from "react-i18next"
import { SeeVoteDetailsModal } from "./SeeVoteDetailsModal"

type Props = {
  roundId: string
  minPercentageToNotMerge?: number
}

const compactFormatter = getCompactFormatter(2)

/**
 * This component displays the user's votes in the current round.
 * It shows the total votes cast by the user and the breakdown of votes among the apps.
 * @param roundId The round id
 * @param minPercentageToNotMerge The minimum percentage to not merge the app into "Rest" - default is 15
 */
export const AllocationRoundUserVotes = ({ roundId, minPercentageToNotMerge }: Props) => {
  const { account } = useWallet()

  const seeAllModal = useDisclosure()

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const totalVotesAtSnapshotQuery = useTotalVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    account?.address ?? "",
  )
  const votesAtSnapshot = totalVotesAtSnapshotQuery.data?.totalVotesWithDeposits
  const votesAtSnapshotLoading = totalVotesAtSnapshotQuery.isLoading

  const { data: castVotesEvent, isLoading: castVotesEventLoading } = useUserVotesInRound(
    roundId,
    account?.address ?? undefined,
  )

  const totalVotesCast = useMemo(
    () => castVotesEvent?.voteWeights.reduce((acc, vote) => acc + Number(ethers.formatEther(vote)), 0),
    [castVotesEvent],
  )

  const totalAppsVoted = useMemo(() => castVotesEvent?.appsIds.length, [castVotesEvent])

  const { data: hasVoted } = useHasVotedInRound(roundId, account?.address ?? undefined)

  const parsedCastVotes: AppVotesBreakdownProps["votes"] = useMemo(() => {
    if (castVotesEvent?.appsIds && votesAtSnapshot) {
      return castVotesEvent.appsIds.map((id, index) => {
        const parsedVotes = Number(ethers.formatEther(castVotesEvent.voteWeights[index] as string))

        return {
          appId: id,
          value: parsedVotes,
          rawValue: parsedVotes,
        }
      })
    }
    return []
  }, [castVotesEvent, votesAtSnapshot])

  const parsedCastVotesPercentages: AppVotesBreakdownProps["votes"] = useMemo(() => {
    if (castVotesEvent?.appsIds && votesAtSnapshot) {
      return castVotesEvent.appsIds.map((id, index) => {
        const parsedVotes = Number(ethers.formatEther(castVotesEvent.voteWeights[index] as string))
        const rawValue = scaledDivision(parsedVotes * 100, Number(votesAtSnapshot))
        return {
          appId: id,
          value: new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN),
          rawValue,
        }
      })
    }
    return []
  }, [castVotesEvent, votesAtSnapshot])

  const breakdownLoading = roundInfoLoading || votesAtSnapshotLoading || castVotesEventLoading

  if (!hasVoted) return null

  return (
    <>
      <SeeVoteDetailsModal
        roundId={roundId}
        votes={parsedCastVotes}
        isOpen={seeAllModal.open}
        onClose={seeAllModal.onClose}
      />

      <Card.Root
        w="full"
        id="user-votes"
        maxH={[!account?.address ? "600px" : "auto", "auto"]}
        overflowY={"hidden"}
        variant="baseWithBorder"
        data-testid={"user-votes-card"}>
        <Card.Body>
          <VStack flex={1} w="full" gap={8} align={"flex-start"}>
            <VStack gap={2} align="flex-start" w="full">
              <HStack w="full" justify="space-between">
                <Heading size="2xl">{t("Your vote")}</Heading>
                <Button variant="ghost" colorPalette="primary" onClick={seeAllModal.onOpen}>
                  {t("See details")}
                  <FiArrowUpRight />
                </Button>
              </HStack>
              <Skeleton loading={castVotesEventLoading}>
                <Text textStyle="md">
                  <Trans
                    i18nKey={"{{amount}} distributed among {{apps}} apps"}
                    values={{ amount: compactFormatter.format(totalVotesCast ?? 0), apps: totalAppsVoted }}
                    t={t}
                  />
                </Text>
              </Skeleton>
            </VStack>
            <AppVotesBreakdown
              votes={parsedCastVotesPercentages}
              isLoading={breakdownLoading}
              minPercentageToNotMerge={minPercentageToNotMerge}
            />
          </VStack>
        </Card.Body>
      </Card.Root>
    </>
  )
}
