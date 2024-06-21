import {
  useAllocationsRound,
  useAllocationsRoundState,
  useGetVotesOnBlock,
  useHasVotedInRound,
  useRoundXApps,
} from "@/api"
import { Card, CardBody, Heading, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useCastAllocationVotes } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"

type Props = {
  roundId: string
}

export type CastAllocationVoteFormData = {
  votes: {
    appId: string
    value: string
    rawValue: number
  }[]
}

export const CastAllocationPageVoteContent = ({ roundId }: Props) => {
  const { account } = useWallet()
  const router = useRouter()

  const { data: state, isLoading: isStateLoading } = useAllocationsRoundState(roundId)
  const { data: xApps } = useRoundXApps(roundId)

  const castAllocationVotes = useCastAllocationVotes({ roundId })

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const hasNoVotes = !votesAtSnapshot || votesAtSnapshot === "0"

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const shouldSeeThePage = useMemo(() => {
    return !hasVoted && !isVotingConcluded
  }, [isVotingConcluded, hasVoted])

  //redirect to round page if user already voted or voting is concluded
  //   useLayoutEffect(() => {
  //     if (!shouldSeeThePage) {
  //       router.push(`/rounds/${roundId}`)
  //     }
  //   }, [shouldSeeThePage, roundId, router])

  //   if (!shouldSeeThePage) return null

  return (
    <Card w="full" id="user-votes" maxH={[!account ? "600px" : "auto", "auto"]} overflowY={"hidden"}>
      <CardBody>
        <VStack w="full" spacing={8}>
          <Heading fontSize={"36px"} fontWeight={700}>
            Select the apps you want to vote
          </Heading>
          <Text fontSize={"16px"} fontWeight={400} color="#6A6A6A">
            The apps you vote will receive a B3TR allocation to distribute among its users as rewards for completing
            sustainable actions. Select your favorite apps to add them to your vote.
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}
