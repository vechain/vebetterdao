import { useAllocationsRound, useAllocationsRoundState, useGetVotesOnBlock, useHasVotedInRound } from "@/api"
import {
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
  VStack,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { useCastAllocationFormStore } from "@/store"
import { AppVotesBreakdown } from "@/app/rounds/components/AppVotesBreakdown/AppVotesBreakdown"
import { TransactionModal } from "@/components"
import { useCastAllocationVotes, CastAllocationVotesProps } from "@/hooks"
import { scaledDivision } from "@/utils/MathUtils"
import { FiArrowUpRight } from "react-icons/fi"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { SeeVoteDetailsModal } from "@/app/rounds/components/AllocationRoundUserVotes/SeeVoteDetailsModal"

type Props = {
  roundId: string
}

const compactFormatter = getCompactFormatter(2)
export const ConfirmCastAllocationVotePageContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const router = useRouter()

  const { data: votes } = useCastAllocationFormStore()
  const { data: state } = useAllocationsRoundState(roundId)

  const { data: roundInfo, isLoading: stateLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const hasNoVotes = !votesAtSnapshot || votesAtSnapshot === "0"

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const transactionModal = useDisclosure()

  const seeAllModal = useDisclosure()

  const onSuccess = useCallback(() => router.push(`/rounds/${roundId}`), [router, roundId])

  const castAllocationVotes = useCastAllocationVotes({ roundId, onSuccess })

  const handleClose = useCallback(() => {
    castAllocationVotes.resetStatus()
    transactionModal.onClose()
  }, [castAllocationVotes, transactionModal])

  const totalVotesToCast = useMemo(() => {
    return (votes.reduce((acc, vote) => acc + Number(vote.rawValue), 0) * Number(votesAtSnapshot)) / 100
  }, [votes, votesAtSnapshot])

  const onContinue = useCallback(() => {
    if (!votesAtSnapshot) throw new Error("Votes at snapshot not found")
    const appVotesPercentagesToValue: CastAllocationVotesProps = votes.map(vote => {
      const rawValue = scaledDivision(Number(vote.rawValue) * Number(votesAtSnapshot), 100)
      return {
        appId: vote.appId,
        votes: rawValue,
      }
    })

    transactionModal.onOpen()
    castAllocationVotes.sendTransaction(appVotesPercentagesToValue)
  }, [castAllocationVotes, transactionModal, votesAtSnapshot, votes])

  const onTryAgain = useCallback(() => {
    castAllocationVotes.resetStatus()
    onContinue()
  }, [castAllocationVotes, onContinue])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const shouldSeeThePage = useMemo(() => {
    return {
      value: !hasVoted && !isVotingConcluded && !hasNoVotes && votes.length > 0,
      loading: hasVotedLoading || stateLoading || votesAtSnapshotLoading,
    }
  }, [hasVotedLoading, hasVoted, isVotingConcluded, hasNoVotes, stateLoading, votesAtSnapshotLoading, votes])

  //   redirect to round page if user already voted or voting is concluded
  useLayoutEffect(() => {
    if (shouldSeeThePage.loading) return
    if (!shouldSeeThePage.value) {
      router.push(`/rounds/${roundId}`)
    }
  }, [shouldSeeThePage, roundId, router])

  if (!shouldSeeThePage) return null

  return (
    <>
      <SeeVoteDetailsModal roundId={roundId} votes={votes} isOpen={seeAllModal.isOpen} onClose={seeAllModal.onClose} />
      <TransactionModal
        isOpen={transactionModal.isOpen}
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
            <YourVoteCardWrapper>
              <VStack flex={1} w="full" spacing={8} align={"flex-start"}>
                <VStack spacing={2} align="flex-start" w="full">
                  <HStack w="full" justify="space-between">
                    <Heading fontSize="24px" fontWeight={700}>
                      {t("Your vote")}
                    </Heading>
                    <Button
                      variant="link"
                      colorScheme="primary"
                      onClick={seeAllModal.onOpen}
                      rightIcon={<FiArrowUpRight />}>
                      {t("See details")}
                    </Button>
                  </HStack>
                  <Skeleton isLoaded={!votesAtSnapshotLoading}>
                    <Text fontSize="16px" fontWeight="400">
                      <Trans
                        i18nKey={"{{amount}} distributed among {{apps}} apps"}
                        values={{ amount: compactFormatter.format(totalVotesToCast ?? 0), apps: votes.length }}
                        t={t}
                      />
                    </Text>
                  </Skeleton>
                </VStack>
                <AppVotesBreakdown votes={votes} />
              </VStack>
            </YourVoteCardWrapper>

            <Stack
              direction={["column", "column", "row"]}
              w="full"
              spacing={4}
              justify={"space-between"}
              align={["center", "center", "flex-start"]}>
              <Text
                fontSize={"16px"}
                fontWeight={600}
                color="#F29B32"
                textAlign={["center", "center", "left"]}
                flex={1}>
                <Trans i18nKey={"Once your vote has been casted, you will not be able to revert it."} t={t} />
              </Text>
              <HStack
                alignSelf={"flex-end"}
                justify={["space-between", "space-between", "flex-end"]}
                spacing={4}
                flex={1}
                w={["full", "full", "auto"]}>
                <Button
                  flex={1}
                  data-testid="go-back"
                  rounded="full"
                  variant={"primarySubtle"}
                  colorScheme="primary"
                  size="lg"
                  onClick={goBack}>
                  {t("Go back")}
                </Button>
                <Button
                  flex={1}
                  form="cast-allocation-vote-form"
                  data-testid="continue"
                  rounded="full"
                  colorScheme="primary"
                  size="lg"
                  onClick={onContinue}>
                  {t("Cast your vote")}
                </Button>
              </HStack>
            </Stack>
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}

const YourVoteCardWrapper = ({ children }: { children: React.ReactNode }) => {
  return useBreakpointValue({
    base: children,
    lg: (
      <Card w="full" variant={"filled"}>
        <CardBody>{children}</CardBody>
      </Card>
    ),
  })
}
