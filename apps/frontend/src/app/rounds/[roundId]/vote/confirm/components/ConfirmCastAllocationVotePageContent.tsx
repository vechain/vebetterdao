import { useAllocationsRound, useAllocationsRoundState, useGetVotesOnBlock, useHasVotedInRound } from "@/api"
import { Button, Card, CardBody, HStack, Heading, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useCastAllocationFormStore } from "@/store"
import { AppVotesBreakdown } from "@/app/rounds/components/AppVotesBreakdown/AppVotesBreakdown"
import { TransactionModal } from "@/components"
import { useCastAllocationVotes, CastAllocationVotesProps } from "@/hooks"
import { scaledDivision } from "@/utils/MathUtils"

type Props = {
  roundId: string
}
export const ConfirmCastAllocationVotePageContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const router = useRouter()

  const { data: votes, setData: onVotesChange } = useCastAllocationFormStore()
  const { data: state, isLoading: isStateLoading } = useAllocationsRoundState(roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const hasNoVotes = !votesAtSnapshot || votesAtSnapshot === "0"

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const { isOpen, onClose, onOpen } = useDisclosure()

  const onSuccess = useCallback(() => router.push(`/rounds/${roundId}`), [router, roundId])

  const castAllocationVotes = useCastAllocationVotes({ roundId, onSuccess })

  const handleClose = useCallback(() => {
    castAllocationVotes.resetStatus()
    onClose()
  }, [castAllocationVotes, onClose])

  const onContinue = useCallback(() => {
    if (!votesAtSnapshot) throw new Error("Votes at snapshot not found")
    const appVotesPercentagesToValue: CastAllocationVotesProps = votes.map(vote => {
      const rawValue = scaledDivision(Number(vote.rawValue) * Number(votesAtSnapshot), 100)
      return {
        appId: vote.appId,
        votes: rawValue,
      }
    })

    onOpen()
    castAllocationVotes.sendTransaction(appVotesPercentagesToValue)
  }, [castAllocationVotes, onOpen, votesAtSnapshot, votes])

  const onTryAgain = useCallback(() => {
    castAllocationVotes.resetStatus()
    onContinue()
  }, [castAllocationVotes, onContinue])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

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
    <>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={castAllocationVotes.error ? "error" : castAllocationVotes.status}
        confirmationTitle={"Confirm Vote"}
        successTitle={"Vote Cast!"}
        errorTitle={"Error casting vote"}
        errorDescription={castAllocationVotes.error?.reason}
        showSocialButtons
        socialDescriptionEncoded="%E2%9C%85%20Just%20cast%20my%20vote%20in%20the%20%23VeBetterDAO%20X%20allocation%20round%21%20%0A%0A%F0%9F%8C%B1%20Excited%20to%20be%20part%20of%20the%20decision-making%20process%20for%20sustainable%20projects.%0A%0AJoin%20us%20in%20shaping%20a%20greener%20future%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        onTryAgain={onTryAgain}
        showTryAgainButton
        showExplorerButton
        txId={castAllocationVotes.txReceipt?.meta.txID ?? castAllocationVotes.sendTransactionTx?.txid}
      />

      <Card w="full">
        <CardBody>
          <VStack w="full" spacing={8} align={"flex-start"}>
            <Heading fontSize={"36px"} fontWeight={700}>
              {t("Review and confirm")}
            </Heading>
            <Text fontSize={"16px"} fontWeight={400} color="#6A6A6A">
              {t(
                "Make sure that the apps you selected and the distribution percentages are right. If something’s wrong, you can go back and modify it.",
              )}
            </Text>
            <AppVotesBreakdown votes={votes} />

            <HStack w="full" spacing={4} justify={"space-between"}>
              <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
                <Button
                  data-testid="go-back"
                  rounded="full"
                  variant={"primarySubtle"}
                  colorScheme="primary"
                  size="lg"
                  onClick={goBack}>
                  {t("Go back")}
                </Button>
                <Button
                  form="cast-allocation-vote-form"
                  data-testid="continue"
                  rounded="full"
                  colorScheme="primary"
                  size="lg"
                  onClick={onContinue}>
                  {t("Continue")}
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}
