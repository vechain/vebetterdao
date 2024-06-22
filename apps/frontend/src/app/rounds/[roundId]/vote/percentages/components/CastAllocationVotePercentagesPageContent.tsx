import { useAllocationsRound, useAllocationsRoundState, useGetVotesOnBlock, useHasVotedInRound } from "@/api"
import { Button, Card, CardBody, Checkbox, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { useCastAllocationFormStore } from "@/store"
import { SelectAppVotesInput, CastAllocationVoteFormData } from "./SelectAppVotesInput"
import { useFieldArray, useForm } from "react-hook-form"

type Props = {
  roundId: string
}
export const CastAllocationVotePercentagesPageContent = ({ roundId }: Props) => {
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

  const castAllocationForm = useForm<CastAllocationVoteFormData>({
    defaultValues: {
      votes,
    },
  })

  const castAllocationFormArray = useFieldArray({
    control: castAllocationForm.control,
    name: "votes",
  })

  const hasNoVotes = !votesAtSnapshot || votesAtSnapshot === "0"

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  console.log("castAllocationForm", castAllocationForm)

  //   const splitEvenly = () => {
  //     const totalAppsToVote = xApps?.length ?? 0
  //     const rawValue = scaledDivision(100, totalAppsToVote)
  //     const remainingPercentage = 100 - rawValue * totalAppsToVote
  //     const votesPerApp = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)

  //     // in case the division is not exact, we add the remaining percentage to a random app
  //     const randomAppIndex = Math.floor(Math.random() * totalAppsToVote)
  //     xApps?.forEach((xApp, index) => {
  //       const parsedRawValue = index === randomAppIndex ? rawValue + remainingPercentage : rawValue
  //       update(index, { appId: xApp.id, value: votesPerApp, rawValue: parsedRawValue })
  //     })
  //   }

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
            {/* <Checkbox colorScheme="primary" onChange={onCheckboxChange} isChecked={isSelectAllChecked}>
              {t("Select all")}
            </Checkbox> */}
          </HStack>
          <VStack
            id="cast-allocation-vote-form"
            as="form"
            w="full"
            spacing={8}
            align={"flex-start"}
            onSubmit={castAllocationForm.handleSubmit(onContinue)}>
            {castAllocationFormArray.fields.map((field, index) => {
              return (
                <SelectAppVotesInput
                  key={field.appId}
                  appId={field.appId}
                  field={field}
                  index={index}
                  control={castAllocationForm.control}
                  errors={castAllocationForm.formState.errors}
                  getValues={castAllocationForm.getValues}
                  totalVotesAvailable={votesAtSnapshot}
                />
              )
            })}
          </VStack>

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
                type="submit">
                {t("Continue")}
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
