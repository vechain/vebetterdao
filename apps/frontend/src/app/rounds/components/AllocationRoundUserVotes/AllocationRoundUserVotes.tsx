import { useAllocationsRound, useGetVotesOnBlock, useHasVotedInRound, useRoundXApps, useUserVotesInRound } from "@/api"
import { Box, Button, Card, CardBody, HStack, Heading, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { AppVotesBreakdown } from "../AppVotesBreakdown/AppVotesBreakdown"
import { useWallet } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import BigNumber from "bignumber.js"
import { scaledDivision } from "@/utils/MathUtils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { Trans } from "react-i18next"

type Props = {
  roundId: string
}

export type FormData = {
  votes: {
    appId: string
    value: string
    rawValue: number
  }[]
}

const compactFormatter = getCompactFormatter(2)

export const AllocationRoundUserVotes = ({ roundId }: Props) => {
  const { account } = useWallet()

  const { data: xApps } = useRoundXApps(roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const { data: castVotesEvent } = useUserVotesInRound(roundId, account ?? undefined)

  const totalVotesCast = useMemo(
    () => castVotesEvent?.voteWeights.reduce((acc, vote) => acc + Number(ethers.formatEther(vote)), 0),
    [castVotesEvent],
  )

  const totalAppsVoted = useMemo(() => castVotesEvent?.appsIds.length, [castVotesEvent])

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore()

  const parsedCastVotesPercentages: FormData["votes"] = useMemo(() => {
    if (castVotesEvent?.appsIds && votesAtSnapshot) {
      return castVotesEvent.appsIds.map((id, index) => {
        const rawValue = scaledDivision(
          Number(ethers.formatEther(castVotesEvent.voteWeights[index] as string)) * 100,
          Number(votesAtSnapshot),
        )
        return {
          appId: id,
          value: new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN),
          rawValue,
        }
      })
    }
    return []
  }, [castVotesEvent, votesAtSnapshot])

  if (!hasVoted) return null

  return (
    <Card
      w="full"
      id="user-votes"
      maxH={[!account ? "600px" : "auto", "auto"]}
      overflowY={"hidden"}
      variant="baseWithBorder">
      <CardBody>
        <VStack flex={1} w="full" spacing={8} align={"flex-start"}>
          <VStack spacing={2} align="flex-start" w="full">
            <HStack w="full" justify="space-between">
              <Heading size="md">{t("Your vote")}</Heading>
              <Button variant="link" colorScheme="primary" rightIcon={<FiArrowUpRight />}>
                {t("See all")}
              </Button>
            </HStack>

            <Text fontSize="16px" fontWeight="400">
              <Trans
                i18nKey={"{{amount}} distributed among {{apps}} apps"}
                values={{ amount: compactFormatter.format(totalVotesCast ?? 0), apps: totalAppsVoted }}
                t={t}
              />
            </Text>
          </VStack>
          <AppVotesBreakdown votes={parsedCastVotesPercentages} roundId={roundId} />
        </VStack>
      </CardBody>
    </Card>
  )
}
