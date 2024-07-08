import { useAllocationsRound, useCurrentAllocationsRoundId, useGetVotesOnBlock, useHasVotedInRound } from "@/api"
import { Button, Card, CardBody, Grid, GridItem, Heading, Image, Show, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FiArrowUpRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

export const CastYourVoteCard: React.FC = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: roundDetail } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundDetail.voteStart),
    account ?? undefined,
  )

  const {
    data: hasVoted,
    isLoading: hasVotedLoading,
    isError: hasVotingError,
  } = useHasVotedInRound(roundId, account ?? undefined)

  const onClick = () => {
    router.push(`/rounds/${roundId}`)
  }

  const hasVotes = Number(votesAtSnapshot) > 0

  if (!account || hasVotedLoading || hasVotingError || hasVoted || !hasVotes) return null

  return (
    <Card borderColor={"#B1F16C"} backgroundColor={"#B1F16C"} variant={"baseWithBorder"}>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={[4, 10]} w="full">
          <GridItem colSpan={2}>
            <VStack spacing={4} w="full" justifyContent={"start"} alignItems={"start"}>
              <Heading fontSize="16px" fontWeight={"700"} textTransform={"uppercase"} color="primary.500">
                {t("Round #{{round}}", {
                  round: roundId,
                })}
              </Heading>
              <Heading fontSize={["24px", "24px", "36px"]} fontWeight={"700"}>
                {t("Time to cast your vote and earn rewards!")}
              </Heading>

              <Text fontSize={["16px"]} fontWeight={400}>
                {t(
                  "The Allocation round #{{roundId}} is active! Vote for your favorite apps to help them get more B3TR and earn rewards for participating.",
                  {
                    roundId,
                  },
                )}
              </Text>

              <Button
                mt={2}
                variant={"primaryAction"}
                borderRadius={"full"}
                rightIcon={<FiArrowUpRight />}
                onClick={onClick}>
                {t("See round")}
              </Button>
            </VStack>
          </GridItem>
          <Show above="lg">
            <GridItem colSpan={1} alignContent={["start", "center"]} justifySelf={["start", "center"]}>
              <Image src="/images/VoteAnimation.svg" boxSize={"219px"} alt="vote-icon" />
            </GridItem>
          </Show>
        </Grid>
      </CardBody>
    </Card>
  )
}
