import { useAllocationsRound, useGetVotesOnBlock, useHasVotedInRound, useRoundXApps, useUserVotesInRound } from "@/api"
import { Box, Button, Card, CardBody, Heading, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { SelectAppVotesInput } from "./components/SelectAppVotesInput"
import { AppVotesBreakdown } from "./components/AppVotesBreakdown"
import { MdHowToVote } from "react-icons/md"
import { CastAllocationVotesProps, useCastAllocationVotes } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"

type Props = {
  roundId: string
}

export type FormData = {
  votes: CastAllocationVotesProps
}
export const AllocationRoundUserVotes = ({ roundId }: Props) => {
  const { account } = useWallet()
  const { data: xApps } = useRoundXApps(roundId)

  const castAllocationVotes = useCastAllocationVotes({ roundId })

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const { data: castedVotesEvent } = useUserVotesInRound(roundId, account ?? undefined)
  console.log("castedVotesEvent", castedVotesEvent)

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)

  const {
    control,
    register,
    watch,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { votes: [] } })
  const { fields, append, remove, update } = useFieldArray({
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
    remove()
    if (parsedCastedVotesPercetanges.length) {
      append(parsedCastedVotesPercetanges)
    } else {
      xApps?.forEach(xApp => {
        append({ id: xApp.id, value: 0 })
      })
    }
  }, [xApps, append, remove, parsedCastedVotesPercetanges])

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
    const votesPerApp = 100 / totalVotes
    xApps?.forEach((xApp, index) => {
      update(index, { id: xApp.id, value: votesPerApp })
    })
  }

  return (
    <Card w="full" id="user-votes">
      <CardBody>
        <Stack
          direction={["column", "column", "row"]}
          w="full"
          align={["center", "center", "stretch"]}
          justify="space-between"
          spacing={16}>
          <VStack flex={1} w="full" spacing={8}>
            <Box>
              <Skeleton isLoaded={!hasVotedLoading}>
                <Heading size="xl">{hasVoted ? "Your voting distribution" : "Assign voting power to dApps"}</Heading>
              </Skeleton>
              <Skeleton isLoaded={!hasVotedLoading}>
                <Text fontSize="md" color="gray.500" mt={4}>
                  {hasVoted
                    ? "You have already cast your vote. See below the distribution of your voting power among the dApps."
                    : "Distribute your voting power among your selected dApps to help them receive more B3TR allocation."}
                </Text>
              </Skeleton>
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
                  {!hasVoted && (
                    <Button variant="link" onClick={splitEvenly}>
                      Split evenly
                    </Button>
                  )}
                </Box>
                <Text fontSize="sm" fontWeight={"thin"} alignSelf={"flex-end"}>
                  {hasVoted ? "Distributed voting power" : "Voting power to distribute"}
                </Text>
              </Stack>
              <VStack spacing={4} mt={8}>
                {fields.map((field, index) => (
                  <SelectAppVotesInput
                    isDisabled={hasVoted}
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
            {!hasVoted && (
              <Button type="submit" leftIcon={<MdHowToVote />} mt={[8, 8, 0]}>
                Cast vote now
              </Button>
            )}
          </form>
        </Stack>
      </CardBody>
    </Card>
  )
}
