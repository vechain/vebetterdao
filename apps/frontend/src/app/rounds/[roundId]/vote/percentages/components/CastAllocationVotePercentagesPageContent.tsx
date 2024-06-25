import { useAllocationsRound, useAllocationsRoundState, useGetVotesOnBlock, useHasVotedInRound } from "@/api"
import { Button, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { useCastAllocationFormStore } from "@/store"
import { SelectAppVotesInput, CastAllocationVoteFormData } from "./SelectAppVotesInput"
import { useFieldArray, useForm } from "react-hook-form"
import { scaledDivision } from "@/utils/MathUtils"
import BigNumber from "bignumber.js"

type Props = {
  roundId: string
}
export const CastAllocationVotePercentagesPageContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const router = useRouter()

  const { data: votes, setData: onVotesChange } = useCastAllocationFormStore()
  const { data: state, isLoading: stateLoading } = useAllocationsRoundState(roundId)

  const { data: roundInfo } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const { formState, control, handleSubmit, getValues } = useForm<CastAllocationVoteFormData>({
    defaultValues: {
      votes,
    },
  })

  const { errors } = formState

  const { fields, replace } = useFieldArray({
    control,
    name: "votes",
  })

  const hasNoVotes = !votesAtSnapshot || votesAtSnapshot === "0"

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const splitEvenly = useCallback(() => {
    const totalAppsToVote = votes.length
    const rawValue = scaledDivision(100, totalAppsToVote)
    // const remainingPercentage = 100 - rawValue * totalAppsToVote
    const votesPerApp = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)

    // in case the division is not exact, we add the remaining percentage to a random app
    // const randomAppIndex = Math.floor(Math.random() * totalAppsToVote)
    const updatedVotes = votes.map(vote => {
      //   const parsedRawValue = index === randomAppIndex ? rawValue + remainingPercentage : rawValue
      return { appId: vote.appId, value: votesPerApp, rawValue }
    })
    replace(updatedVotes)
  }, [votes, replace])

  const onContinue = useCallback(
    (data: CastAllocationVoteFormData) => {
      onVotesChange(data.votes)
      router.push(`/rounds/${roundId}/vote/confirm`)
    },
    [router, roundId, onVotesChange],
  )

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
    <Card w="full">
      <CardBody>
        <VStack w="full" spacing={8} align={"flex-start"}>
          <Heading fontSize={"36px"} fontWeight={700}>
            {t("Assign percentage of VOT3 to the apps")}
          </Heading>
          <Text fontSize={"16px"} fontWeight={400} color="#6A6A6A">
            {t(
              "The apps you vote will receive a B3TR allocation to distribute among its users as rewards for completing sustainable actions. Select your favorite apps to add them to your vote.",
            )}
          </Text>
          <HStack w="full" spacing={4} justify={"space-between"}>
            <Heading fontSize={"20px"} fontWeight={700}>
              <Trans i18nKey={"{{amount}} selected apps"} values={{ amount: votes.length }} t={t} />
            </Heading>
            <Button variant={"primaryLink"} onClick={splitEvenly}>
              {t("Split evenly")}
            </Button>
          </HStack>
          <VStack
            id="cast-allocation-vote-form"
            as="form"
            w="full"
            spacing={8}
            align={"flex-start"}
            onSubmit={handleSubmit(onContinue)}>
            {fields.map((field, index) => {
              return (
                <SelectAppVotesInput
                  key={field.id}
                  appId={field.appId}
                  field={field}
                  index={index}
                  control={control}
                  errors={errors}
                  getValues={getValues}
                  totalVotesAvailable={votesAtSnapshot}
                />
              )
            })}
          </VStack>

          <HStack
            alignSelf={"flex-end"}
            justify={["space-between", "space-between", "flex-end"]}
            spacing={4}
            flex={1}
            w={["full", "full", "auto"]}>
            <Button data-testid="go-back" flex={1} variant="primarySubtle" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button
              form="cast-allocation-vote-form"
              data-testid="continue"
              flex={1}
              variant="primaryAction"
              type="submit">
              {t("Cast your vote")}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
