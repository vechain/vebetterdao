import {
  useAllocationsRound,
  useAllocationsRoundState,
  useGetVotesOnBlock,
  useHasVotedInRound,
  useRoundXApps,
} from "@/api"
import { Button, Card, CardBody, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { CastVoteData, useCastAllocationFormStore } from "@/store"
import { SearchAndSelectApps } from "./components/SearchAndSelectApps"

type Props = {
  roundId: string
}

export const CastAllocationPageVoteContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const router = useRouter()

  const { data: selectedApps, setData: onSelectedAppsChange } = useCastAllocationFormStore()
  const { data: state, isLoading: isStateLoading } = useAllocationsRoundState(roundId)
  const xAppsQuery = useRoundXApps(roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const hasNoVotes = !votesAtSnapshot || votesAtSnapshot === "0"

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const [onContinueError, setOnContinueError] = useState<string | null>(null)

  const handleOnSelectedAppsChange = useCallback(
    (data: CastVoteData) => {
      setOnContinueError(null)
      onSelectedAppsChange(data)
    },
    [onSelectedAppsChange],
  )

  const onContinue = useCallback(() => {
    if (!selectedApps || selectedApps.length === 0) return setOnContinueError(t("Select at least one app to continue"))
    router.push(`/rounds/${roundId}/vote/percentages`)
  }, [router, roundId, selectedApps, t])

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
            {t("Select the apps you want to vote")}
          </Heading>
          <Text fontSize={"16px"} fontWeight={400} color="#6A6A6A">
            {t(
              "The apps you vote will receive a B3TR allocation to distribute among its users as rewards for completing sustainable actions. Select your favorite apps to add them to your vote.",
            )}
          </Text>

          <SearchAndSelectApps
            selectedApps={selectedApps}
            onSelectedAppsChange={handleOnSelectedAppsChange}
            xAppsQuery={xAppsQuery}
          />

          <Stack
            direction={["column", "column", "row"]}
            w="full"
            spacing={4}
            justify={"space-between"}
            align={["center", "center", "flex-start"]}>
            {onContinueError ? (
              <Text fontSize={"16px"} fontWeight={600} color="#C84968">
                {onContinueError}
              </Text>
            ) : (
              <Text fontSize={"16px"} fontWeight={400} color="#252525">
                <Trans i18nKey={"{{amount}} selected apps"} values={{ amount: selectedApps?.length ?? 0 }} t={t} />
              </Text>
            )}
            <HStack
              alignSelf={"flex-end"}
              justify={["space-between", "space-between", "flex-end"]}
              spacing={4}
              w={["full", "full", "auto"]}>
              <Button
                data-testid="go-back"
                rounded="full"
                variant={"primarySubtle"}
                colorScheme="primary"
                size="lg"
                flex={1}
                onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button
                flex={1}
                data-testid="continue"
                rounded="full"
                colorScheme="primary"
                size="lg"
                onClick={onContinue}>
                {t("Continue")}
              </Button>
            </HStack>
          </Stack>
        </VStack>
      </CardBody>
    </Card>
  )
}
