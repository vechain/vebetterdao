import { Alert, Button, Card, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useCanProposalStartInNextRound } from "../../../../../../api/contracts/governance/hooks/useCanProposalStartInNextRound"
import { useCurrentAllocationsRoundId } from "../../../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { buttonClicked, buttonClickActions, ButtonClickProperties } from "../../../../../../constants/AnalyticsEvents"
import { useProposalFormStore } from "../../../../../../store/useProposalFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"

import { SelectedRoundRadioCard } from "./SelectedRoundRadioCard"

const roundsToRender = 3
export const NewProposalRoundPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const {
    data: currentRoundId,
    isLoading: isCurrentRoundIdLoading,
    error: currentRoundIdError,
  } = useCurrentAllocationsRoundId()
  const {
    data: canStartInNextRound,
    isLoading: isCanStartInNextRoundLoading,
    error: canStartInNextRoundError,
  } = useCanProposalStartInNextRound()
  const { votingStartRoundId, setData } = useProposalFormStore()
  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/support")
    AnalyticsUtils.trackEvent(
      buttonClicked,
      buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL_ROUND_SELECTION),
    )
  }, [router])
  const rounds = useMemo(() => {
    if (!currentRoundId || typeof canStartInNextRound === "undefined") return []
    return Array.from({ length: roundsToRender }, (_, index) => {
      const roundId = canStartInNextRound ? Number(currentRoundId) + index + 1 : Number(currentRoundId) + index + 2
      return {
        id: roundId,
        startDate: dayjs().add(index, "week").format("MMM D, YYYY"),
        canStart: canStartInNextRound,
      }
    })
  }, [currentRoundId, canStartInNextRound])

  const onSelectRound = useCallback(
    (roundId: number) => () => {
      setData({ votingStartRoundId: roundId })
    },
    [setData],
  )

  const isLoading = isCurrentRoundIdLoading || isCanStartInNextRoundLoading

  const renderRoundContent = () => {
    if (isLoading) {
      return [...Array(roundsToRender).keys()].map(index => (
        <SelectedRoundRadioCard
          key={index}
          roundId={index}
          selected={false}
          onSelect={() => {}}
          renderSkeleton={true}
        />
      ))
    }

    if (rounds.length === 0) {
      return (
        <Alert.Root status="error" borderRadius={"lg"}>
          <Alert.Indicator />
          <Alert.Title>{t("No rounds available")}</Alert.Title>
          <Alert.Description>
            {(currentRoundIdError as Error)?.message ??
              (canStartInNextRoundError as Error)?.message ??
              t("Emissions have propably not started yet")}
          </Alert.Description>
        </Alert.Root>
      )
    }

    return rounds.map(round => (
      <SelectedRoundRadioCard
        key={round.id}
        roundId={round.id}
        selected={round.id === votingStartRoundId}
        onSelect={onSelectRound(round.id)}
        isSelectable={true}
        renderSkeleton={false}
      />
    ))
  }

  return (
    <Card.Root variant="primary">
      <Card.Body py={8}>
        <VStack gap={8} align="flex-start">
          <VStack gap={[4, 6]} align="flex-start">
            <Heading size={["xl", "2xl"]}>{t("Select a voting session date")}</Heading>
            <Text textStyle={["sm", "md"]}>
              {t("Choose the")}{" "}
              <Text as="span" fontWeight="semibold">
                {t("weekly round")}{" "}
              </Text>
              {t(
                "during which your proposal will be considered for voting. Weekly rounds occur regularly on this platform along with the allocations.",
              )}
            </Text>
          </VStack>

          {renderRoundContent()}

          <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
            <Button data-testid="go-back" variant="link" onClick={router.back}>
              {t("Go back")}
            </Button>
            <Button
              data-testid="continue"
              variant="primary"
              onClick={onContinue}
              disabled={!votingStartRoundId}
              form="new-proposal-form">
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
