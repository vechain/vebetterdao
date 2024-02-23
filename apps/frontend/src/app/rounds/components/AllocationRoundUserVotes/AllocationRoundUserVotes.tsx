import { useAllocationsRound, useGetVotesOnBlock, useHasVotedInRound, useRoundXApps, useUserVotesInRound } from "@/api"
import { Box, Button, Card, CardBody, Flex, Heading, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { SelectAppVotesInput } from "./components/SelectAppVotesInput"
import { AppVotesBreakdown } from "./components/AppVotesBreakdown"
import { MdHowToVote } from "react-icons/md"
import { CastAllocationVotesProps, useCastAllocationVotes } from "@/hooks"
import { WalletButton, useWallet } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import { backdropBlurAnimation } from "@/app/theme"

type Props = {
  roundId: string
}

export type FormData = {
  votes: CastAllocationVotesProps
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

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

  const { data: castedVotesEvent } = useUserVotesInRound(roundId, account ?? undefined)
  console.log("castedVotesEvent", castedVotesEvent)

  const totalVotesCasted = useMemo(
    () => castedVotesEvent?.voteWeights.reduce((acc, vote) => acc + Number(ethers.formatEther(vote)), 0),
    [castedVotesEvent],
  )

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore()

  const isFormDisabled =
    hasVoted || isVotingConcluded || roundInfoLoading || votesAtSnapshotLoading || hasVotedLoading || hasNoVotes

  const {
    control,
    register,
    watch,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { votes: [] } })
  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "votes", // unique name for your Field Array
  })

  console.log("fields", fields)

  const watchVotes = watch("votes")

  const parsedCastedVotesPercetanges = useMemo(() => {
    if (castedVotesEvent?.appsIds && votesAtSnapshot?.scaled) {
      return castedVotesEvent.appsIds.map((id, index) => ({
        id,
        value:
          (Number(ethers.formatEther(castedVotesEvent.voteWeights[index] as string)) / Number(votesAtSnapshot.scaled)) *
          100,
      }))
    }
    return []
  }, [castedVotesEvent, votesAtSnapshot])

  //TODO: this is causing issues as we're removing user choices when nex xApps data is fetched
  useEffect(() => {
    if (parsedCastedVotesPercetanges.length) {
      replace(parsedCastedVotesPercetanges)
    } else {
      const values = xApps?.map(xApp => ({ id: xApp.id, value: 0 }))
      replace(values ?? [])
    }
  }, [xApps, replace, parsedCastedVotesPercetanges])

  const onSubmit = (data: FormData) => {
    if (!votesAtSnapshot) throw new Error("Votes at snapshot not found")
    const appVotesPercentagesToValue = data.votes.map(vote => ({
      id: vote.id,
      value: Math.floor((vote.value * Number(votesAtSnapshot.scaled)) / 100),
    }))
    console.log("data", data, "appVotesPercentagesToValue", appVotesPercentagesToValue)
    castAllocationVotes.sendTransaction(appVotesPercentagesToValue)
  }

  const splitEvenly = () => {
    const totalVotes = xApps?.length ?? 0
    const votesPerApp = Math.floor(100 / totalVotes) // Integer division to ensure sum equals 100
    const remainder = 100 - votesPerApp * totalVotes // Calculate the remainder
    const value = votesPerApp + remainder // Add the remainder to the first app
    xApps?.forEach((xApp, index) => {
      update(index, { id: xApp.id, value: index === 0 ? value : votesPerApp })
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
          <Heading size="md" color={hasVoted ? "green" : "orange"}>
            {compactFormatter.format(totalVotesCasted ?? 0)} votes casted
          </Heading>
        </Stack>
      )

    return <Heading size="xl">{hasVoted ? "Your voting distribution" : "Assign voting power to dApps"}</Heading>
  }, [hasVoted, isVotingConcluded, totalVotesCasted])

  const renderSubHeader = useMemo(() => {
    if (isVotingConcluded)
      return (
        <Text fontSize="md" fontWeight="thin" mt={4}>
          {hasVoted
            ? "Voting is concluded. See below the distribution of your voting power among the dApps."
            : "Voting is concluded. You can no longer cast your vote. No votes were casted."}
        </Text>
      )
    return (
      <Text fontSize="md" fontWeight="thin" mt={4}>
        {hasVoted
          ? "You have already cast your vote. See below the distribution of your voting power among the dApps."
          : "Distribute your voting power among your selected dApps to help them receive more B3TR allocation."}
      </Text>
    )
  }, [hasVoted, isVotingConcluded])

  return (
    <Card w="full" id="user-votes">
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
                  <Heading size="md">{hasVoted ? "Voted dApps" : "Available dApps"}</Heading>
                  {!hasVoted && !isVotingConcluded && (
                    <Button variant="link" onClick={splitEvenly}>
                      Split evenly
                    </Button>
                  )}
                </Box>
                <Text fontSize="sm" fontWeight={"thin"}>
                  {hasVoted || isVotingConcluded ? "Distributed voting power" : "Voting power to distribute"}
                </Text>
              </Stack>
              <VStack spacing={4} mt={8}>
                {fields.map((field, index) => (
                  <SelectAppVotesInput
                    totalVotesAvailable={votesAtSnapshot?.scaled}
                    isDisabled={isFormDisabled}
                    register={register}
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
              <Box w="full">
                <Button
                  w="full"
                  isDisabled={isFormDisabled}
                  type="submit"
                  leftIcon={<MdHowToVote />}
                  mt={[8, 8, 0]}
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
      {!account && (
        <Flex
          borderRadius={"lg"}
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center">
          <Card w={["90%", "50%", "40%"]}>
            <CardBody>
              <VStack gap={4}>
                <Heading size="xl" textAlign={"center"}>
                  No wallet connected
                </Heading>
                <Text textAlign={"center"} fontSize="lg" fontWeight={"thin"}>
                  Connect your wallet to cast votes and participate in the B3TR allocation process.
                </Text>
                <WalletButton />
              </VStack>
            </CardBody>
          </Card>
        </Flex>
      )}
    </Card>
  )
}
