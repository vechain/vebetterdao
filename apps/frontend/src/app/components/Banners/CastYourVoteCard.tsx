import { useAllocationsRound, useCurrentAllocationsRoundId, useGetVotesOnBlock, useHasVotedInRound } from "@/api"
import { Button, Card, Grid, GridItem, Heading, Image, Text, useBreakpointValue, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { FiArrowUpRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import voteAnimation from "../../../../public/assets/animations/vote.json"
import Lottie from "react-lottie"

export const CastYourVoteCard: React.FC = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: roundDetail } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot } = useGetVotesOnBlock(
    roundDetail.voteStart ? Number(roundDetail.voteStart) : undefined,
    account?.address ?? undefined,
  )

  const lottieSize = useBreakpointValue(
    {
      base: "109px",
      lg: "219px",
    },
    {
      // Breakpoint to use when mediaqueries cannot be used, such as in server-side rendering
      // (Defaults to 'base')
      fallback: "base",
    },
  )

  const {
    data: hasVoted,
    isLoading: hasVotedLoading,
    isError: hasVotingError,
  } = useHasVotedInRound(roundId, account?.address ?? undefined)

  const onClick = () => {
    router.push(`/rounds/${roundId}`)
  }

  const hasVotes = Number(votesAtSnapshot) > 0

  if (!account?.address || hasVotedLoading || hasVotingError || hasVoted || !hasVotes) return null

  return (
    <Card.Root borderColor={"#B1F16C"} backgroundColor={"#B1F16C"} variant={"baseWithBorder"} overflow={"hidden"}>
      <Card.Body p={6} pos="relative">
        <Image
          transform={{ rotate: "180deg" }}
          src="/assets/backgrounds/cast-vote-card-bg.svg"
          alt="Rewards background"
          pos="absolute"
          right={"-18%"}
          top={["-36%", "-36%", 0]}
          boxSize={"full"}
          w="full"
        />
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={[4, 10]} w="full">
          <GridItem colSpan={2} order={[2, 2, 1]}>
            <VStack gap={4} w="full" justifyContent={"start"} alignItems={"start"}>
              <Heading fontSize="16px" fontWeight={"700"} textTransform={"uppercase"} color="primary.500" zIndex={1}>
                {t("Round #{{round}}", {
                  round: roundId,
                })}
              </Heading>
              <Heading fontSize={["24px", "24px", "36px"]} fontWeight={"700"} zIndex={1}>
                {t("Time to cast your vote and earn rewards!")}
              </Heading>

              <Text fontSize={["16px"]} fontWeight={400} zIndex={1}>
                {t(
                  "The Allocation round #{{roundId}} is active! Vote for your favorite apps to help them get more B3TR and earn rewards for participating.",
                  {
                    roundId,
                  },
                )}
              </Text>

              <Button zIndex={1} mt={2} variant={"primaryAction"} borderRadius={"full"} onClick={onClick}>
                {t("See round")}
                <FiArrowUpRight color="#FFFFFF" />
              </Button>
            </VStack>
          </GridItem>

          <GridItem colSpan={1} order={[1, 1, 2]} alignContent={["start", "center"]} justifySelf={["start", "center"]}>
            {/* @ts-ignore eslint-disable-line */}
            <Lottie
              style={{
                pointerEvents: "none",
              }}
              options={{
                loop: true,
                autoplay: true,
                animationData: voteAnimation,
              }}
              height={lottieSize}
              width={lottieSize}
            />
          </GridItem>
        </Grid>
      </Card.Body>
    </Card.Root>
  )
}
