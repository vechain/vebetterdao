import { Button, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"

import { useCanProposalStartInNextRound, useCurrentAllocationsRoundId } from "@/api"
import dayjs from "dayjs"
import { SelectedRoundRadioCard } from "./SelectedRoundRadioCard"
import { useTranslation } from "react-i18next"

const roundsToRender = 3

export const NewProposalRoundPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: canStartInNextRound, isLoading: isCanStartInNextRoundLoading } = useCanProposalStartInNextRound()

  const { votingStartRoundId, setData } = useProposalFormStore()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/support")
  }, [router])

  const rounds = useMemo(() => {
    if (!currentRoundId || isCanStartInNextRoundLoading) return []
    return Array.from({ length: roundsToRender }, (_, index) => {
      const roundId = canStartInNextRound ? Number(currentRoundId) + index + 1 : Number(currentRoundId) + index + 2
      return {
        id: roundId,
        startDate: dayjs().add(index, "week").format("MMM D, YYYY"),
        canStart: canStartInNextRound,
      }
    })
  }, [currentRoundId, canStartInNextRound, isCanStartInNextRoundLoading])

  const onSelectRound = useCallback(
    (roundId: number) => () => {
      setData({ votingStartRoundId: roundId })
    },
    [setData],
  )

  return (
    <Card>
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">{t("Select a voting session date")}</Heading>
          <Text fontSize="md">
            {t("Choose the")}{" "}
            <Text as="span" fontWeight={600}>
              {t("weekly round")}{" "}
            </Text>
            {t(
              "during which your proposal will be considered for voting. Weekly rounds occur regularly on this platform along with the allocations.",
            )}
          </Text>

          {rounds.length === 0
            ? [...Array(roundsToRender).keys()].map(index => (
                <SelectedRoundRadioCard
                  key={index}
                  roundId={index}
                  selected={false}
                  onSelect={() => {}}
                  renderSkeleton={true}
                />
              ))
            : rounds.map(round => (
                <SelectedRoundRadioCard
                  key={round.id}
                  roundId={round.id}
                  selected={round.id === votingStartRoundId}
                  onSelect={onSelectRound(round.id)}
                  isSelectable={true}
                  renderSkeleton={false}
                />
              ))}

          <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
            <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button
              rounded="full"
              colorScheme="primary"
              size="lg"
              onClick={onContinue}
              isDisabled={!votingStartRoundId}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
