import { useProposalInteractionDates } from "@/api"
import { GrantProposalEnriched, ProposalEnriched, ProposalState, ProposalType } from "@/hooks"
import { Card, Circle, Heading, Icon, Steps, Text, VStack, HStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { t } from "i18next"
import { Calendar } from "iconoir-react"
import { useMemo } from "react"

type Props = {
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalTimeline = ({ proposal }: Props) => {
  const { supportEndDate, votingEndDate, hasValidDates, isLoading } = useProposalInteractionDates(proposal?.id ?? "")

  const proposalCreatedAt = proposal?.createdAt ?? 0
  const proposalVotingRoundId = proposal?.votingRoundId ?? 1
  const isGrant = proposal?.type === ProposalType.Grant
  const hasActions = Array.isArray(proposal?.values) && proposal?.values.length > 0

  const timelineDates = useMemo(() => {
    return {
      supportStartDate: proposalCreatedAt * 1000,
      supportEndDate: supportEndDate,
      votingEndDate: votingEndDate,
      hasValidDates: hasValidDates,
      isLoading: isLoading,
    }
  }, [proposalCreatedAt, supportEndDate, votingEndDate, hasValidDates, isLoading])

  const timelineSteps = useMemo(
    () => [
      {
        label: t("Support phase"),
        state: [ProposalState.Pending],
        description: t("Round #{{roundId}}: {{dateString}}", {
          roundId: Number(proposalVotingRoundId) - 1,
          dateString: dayjs(timelineDates.supportStartDate).format("MMM D, YYYY"),
        }),
      },
      {
        label: t("Approval phase"),
        state: [ProposalState.Active, ProposalState.Succeeded],
        description: timelineDates.hasValidDates
          ? t("Round #{{roundId}}: {{dateString}}", {
              roundId: Number(proposalVotingRoundId),
              dateString: `${dayjs(timelineDates.supportEndDate).format("MMM D, YYYY")} - ${dayjs(timelineDates.votingEndDate).format("MMM D, YYYY")}`,
            })
          : "---",
      },
      ...(hasActions
        ? [
            {
              label: isGrant ? t("In development") : t("Executed"),
              state: [ProposalState.InDevelopment, ProposalState.Executed, ProposalState.Queued],
              description: timelineDates.hasValidDates
                ? dayjs(timelineDates.votingEndDate).format("MMM D, YYYY")
                : "---",
            },
          ]
        : []),
      {
        label: t("Completed"),
        state: [ProposalState.Completed],
        description: "Project completed successfully",
      },
    ],
    [
      proposalVotingRoundId,
      timelineDates.supportStartDate,
      timelineDates.supportEndDate,
      timelineDates.votingEndDate,
      timelineDates.hasValidDates,
      hasActions,
      isGrant,
    ],
  )

  const invalidState = useMemo(() => {
    return (
      proposal?.state === ProposalState.Defeated ||
      proposal?.state === ProposalState.Canceled ||
      proposal?.state === ProposalState.DepositNotMet
    )
  }, [proposal?.state])

  const currentStep = useMemo(() => {
    if (!proposal) return 0
    const stepIndex = timelineSteps.findIndex(step => step.state.includes(proposal.state))
    return stepIndex >= 0 ? stepIndex : 0
  }, [proposal, timelineSteps])

  return (
    <>
      <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"} p={0} gap={0}>
        <Card.Header>
          <HStack gap={2}>
            <Icon as={Calendar} boxSize={5} />
            <Heading fontSize={"20px"} fontWeight={700}>
              {t("Timeline")}
            </Heading>
          </HStack>
        </Card.Header>
        <Card.Body pb={0}>
          <Steps.Root
            orientation="vertical"
            defaultStep={0}
            count={timelineSteps.length}
            size="sm"
            w="full"
            h="full"
            step={currentStep}
            colorPalette={invalidState ? "red" : "blue"}
            variant="primaryVertical">
            <Steps.List>
              {timelineSteps.map((step, index) => (
                <Steps.Item key={`timeline-step-${step.state}`} index={index} minH={20}>
                  <Steps.Indicator>
                    <Steps.Status
                      incomplete={<Circle bg={"actions.primary.default"} size="0" />}
                      complete={<Circle bg={"actions.primary.default"} size="40%" />}
                      current={<Circle bg={"actions.primary.default"} size="55%" />}
                    />
                  </Steps.Indicator>
                  <Steps.Separator />
                  <VStack align="start" flex={1}>
                    <Text fontSize="sm" color={currentStep === index ? "text.strong" : "text.subtle"}>
                      {step.label}
                    </Text>
                    <Text fontSize="xs" color="text.subtle">
                      {step.description}
                    </Text>
                  </VStack>
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>
        </Card.Body>
      </Card.Root>
    </>
  )
}
