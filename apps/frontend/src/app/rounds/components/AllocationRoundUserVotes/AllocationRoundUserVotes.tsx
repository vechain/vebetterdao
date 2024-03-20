import { useAllocationsRound, useGetVotesOnBlock, useHasVotedInRound, useRoundXApps, useUserVotesInRound } from "@/api"
import { Box, Button, Card, CardBody, Heading, Skeleton, Stack, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { SelectAppVotesInput } from "./components/SelectAppVotesInput"
import { AppVotesBreakdown } from "./components/AppVotesBreakdown"
import { MdHowToVote } from "react-icons/md"
import { CastAllocationVotesProps, useCastAllocationVotes } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import { TransactionModal } from "@/components/TransactionModal"
import BigNumber from "bignumber.js"
import { WalletNotConnectedOverlay } from "@/components"
import { scaledDivision } from "@/utils/MathUtils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type Props = {
  roundId: string
}

export type FormData = {
  votes: CastAllocationVotesProps
}

const compactFormatter = getCompactFormatter(2)

export const AllocationRoundUserVotes = ({ roundId }: Props) => {
  const { account } = useWallet()
  const { data: xApps } = useRoundXApps(roundId)

  const castAllocationVotes = useCastAllocationVotes({ roundId })

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const hasNoVotes = !votesAtSnapshot?.scaled || votesAtSnapshot.scaled === "0"

  const { data: castVotesEvent } = useUserVotesInRound(roundId, account ?? undefined)

  const totalVotesCast = useMemo(
    () => castVotesEvent?.voteWeights.reduce((acc, vote) => acc + Number(ethers.formatEther(vote)), 0),
    [castVotesEvent],
  )

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore()

  const isFormDisabled =
    hasVoted || isVotingConcluded || roundInfoLoading || votesAtSnapshotLoading || hasVotedLoading || hasNoVotes

  const {
    control,
    watch,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { votes: [] } })
  const { fields, update, replace } = useFieldArray({
    control,
    name: "votes", // unique name for your Field Array
  })

  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleClose = useCallback(() => {
    castAllocationVotes.resetStatus()
    onClose()
  }, [castAllocationVotes.resetStatus, onClose])

  const watchVotes = watch("votes")

  const parsedCastVotesPercentages = useMemo(() => {
    if (castVotesEvent?.appsIds && votesAtSnapshot?.scaled) {
      return castVotesEvent.appsIds.map((id, index) => {
        const rawValue = scaledDivision(
          Number(ethers.formatEther(castVotesEvent.voteWeights[index] as string)) * 100,
          Number(votesAtSnapshot.scaled),
        )
        return {
          id,
          value: new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN),
          rawValue,
        }
      })
    }
    return []
  }, [castVotesEvent, votesAtSnapshot])

  //TODO: this is causing issues as we're removing user choices when nex xApps data is fetched
  useEffect(() => {
    if (parsedCastVotesPercentages.length) {
      replace(parsedCastVotesPercentages)
    } else {
      const values = xApps?.map(xApp => ({ id: xApp.id, value: "", rawValue: 0 }))
      replace(values ?? [])
    }
  }, [xApps, replace, parsedCastVotesPercentages])

  const onSubmit = (data: FormData) => {
    if (!votesAtSnapshot) throw new Error("Votes at snapshot not found")
    const appVotesPercentagesToValue = data.votes.map(vote => {
      const rawValue = scaledDivision(Number(vote.value) * Number(votesAtSnapshot.scaled), 100)
      return {
        id: vote.id,
        value: new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN),
        rawValue,
      }
    })

    onOpen()
    castAllocationVotes.sendTransaction(appVotesPercentagesToValue)
  }

  const splitEvenly = () => {
    const totalVotes = xApps?.length ?? 0
    const rawValue = scaledDivision(100, totalVotes)
    const votesPerApp = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)
    xApps?.forEach((xApp, index) => {
      update(index, { id: xApp.id, value: votesPerApp, rawValue })
    })
  }

  const renderHeader = useMemo(() => {
    if (isVotingConcluded)
      return (
        <Stack
          direction={["column", "row"]}
          align={["flex-start", "flex-end"]}
          justify={["flex-start", "space-between"]}
          w="full"
          spacing={0}>
          <Heading size="xl">Voting concluded</Heading>
          <Heading size="md" color={hasVoted ? "green.500" : "orange.500"}>
            {compactFormatter.format(totalVotesCast ?? 0)} votes cast
          </Heading>
        </Stack>
      )

    return <Heading size="xl">{hasVoted ? "Your voting distribution" : "Assign voting power to apps"}</Heading>
  }, [hasVoted, isVotingConcluded, totalVotesCast])

  const renderSubHeader = useMemo(() => {
    if (isVotingConcluded)
      return (
        <Text fontSize="md" fontWeight="400" mt={4}>
          {hasVoted
            ? "Voting is concluded. See below the distribution of your voting power among the apps."
            : "Voting is concluded. You can no longer cast your vote. No votes were cast."}
        </Text>
      )
    return (
      <Text fontSize="md" fontWeight="400" mt={4}>
        {hasVoted
          ? "You have already cast your vote. See below the distribution of your voting power among the apps."
          : "Distribute your voting power among your selected apps to help them receive more B3TR allocation."}
      </Text>
    )
  }, [hasVoted, isVotingConcluded])

  return (
    <Card w="full" id="user-votes" maxH={[!account ? "600px" : "auto", "auto"]} overflowY={"hidden"}>
      <CardBody>
        <Stack
          direction={["column", "column", "row"]}
          w="full"
          align={["center", "center", "stretch"]}
          justify="space-between"
          spacing={16}>
          <VStack flex={1} w="full" spacing={8} align={"flex-start"}>
            <Box>
              <Skeleton isLoaded={!hasVotedLoading}>{renderHeader}</Skeleton>
              <Skeleton isLoaded={!hasVotedLoading}>{renderSubHeader}</Skeleton>
            </Box>
            <AppVotesBreakdown votes={watchVotes} roundId={roundId} />
          </VStack>
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
            <Box>
              <Stack
                direction={["column", "row", "row"]}
                justify={["space-between"]}
                align={["flex-start", "center", "center"]}
                w="full">
                <Box>
                  <Heading size="md">{hasVoted ? "Voted apps" : "Available apps"}</Heading>
                  {!hasVoted && !isVotingConcluded && (
                    <Button variant="link" onClick={splitEvenly}>
                      Split evenly
                    </Button>
                  )}
                </Box>
                <Text fontSize="sm" fontWeight={400}>
                  {hasVoted || isVotingConcluded ? "Distributed voting power" : "Voting power to distribute"}
                </Text>
              </Stack>
              <VStack spacing={4} mt={8}>
                {fields.map((field, index) => (
                  <SelectAppVotesInput
                    totalVotesAvailable={votesAtSnapshot?.scaled}
                    isDisabled={isFormDisabled}
                    control={control}
                    getValues={getValues}
                    errors={errors}
                    field={field}
                    key={field.id}
                    index={index}
                    xApp={xApps?.[index]}
                  />
                ))}
              </VStack>
            </Box>
            {!hasVoted && !isVotingConcluded && (
              <Box w="full" mt={8}>
                <Button
                  w="full"
                  isDisabled={isFormDisabled}
                  type="submit"
                  size="lg"
                  colorScheme="primary"
                  borderRadius={"full"}
                  leftIcon={<MdHowToVote />}
                  isLoading={castAllocationVotes.sendTransactionPending ?? castAllocationVotes.isTxReceiptLoading}>
                  Cast vote now
                </Button>
                {hasNoVotes && (
                  <Text size="sm" textAlign={"center"} mt={1} color="orange">
                    You have no votes to cast
                  </Text>
                )}
              </Box>
            )}
          </form>
        </Stack>
      </CardBody>
      {!account && <WalletNotConnectedOverlay description="Connect your wallet to cast your vote!" />}
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={castAllocationVotes.status}
        confirmationTitle={"Confirm Vote"}
        successTitle={"Vote Cast!"}
        showSocialButtons
        socialDescriptionEncoded="%E2%9C%85%20Just%20cast%20my%20vote%20in%20the%20%23VeBetterDAO%20X%20allocation%20round%21%20%0A%0A%F0%9F%8C%B1%20Excited%20to%20be%20part%20of%20the%20decision-making%20process%20for%20sustainable%20projects.%0A%0AJoin%20us%20in%20shaping%20a%20greener%20future%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        onTryAgain={handleSubmit(onSubmit)}
        showTryAgainButton
        showExplorerButton
        txId={castAllocationVotes.txReceipt?.meta.txID ?? castAllocationVotes.sendTransactionTx?.txid}
      />
    </Card>
  )
}
