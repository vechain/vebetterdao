import { Card, Circle, Heading, HStack, Icon, Steps, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { t } from "i18next"
import { Calendar } from "iconoir-react"
import { useMemo } from "react"

import { GrantDetail } from "@/app/grants/types"
import { ProposalDetail } from "@/app/proposals/types"
import { useProposalCompletedEvent } from "@/hooks/proposals/common/useProposalCompletedEvent.ts"
import { useProposalInDevelopmentEvent } from "@/hooks/proposals/common/useProposalInDevelopmentEvent"

import { useIsGrantRejected } from "../../../../../api/contracts/governance/hooks/useIsGrantRejected"
import { useProposalInteractionDates } from "../../../../../api/contracts/governance/hooks/useProposalInteractionDates"
import { ProposalState, ProposalType } from "../../../../../hooks/proposals/grants/types"

type CustomState = ProposalState | "Created"
type TimelineStep = {
  label: string
  state: CustomState[]
  description?: string
}
type Props = {
  proposal?: ProposalDetail | GrantDetail
}

export const ProposalTimeline = ({ proposal }: Props) => {
  const proposalId = proposal?.proposalId.toString() || ""
  const { supportEndDate, votingEndDate, hasValidDates, isLoading } = useProposalInteractionDates(proposalId)
  const { data: proposalInDevelopmentEvent } = useProposalInDevelopmentEvent(proposalId)
  const { data: proposalCompletedEvent } = useProposalCompletedEvent(proposalId)
  const { data: isGrantRejected } = useIsGrantRejected(proposalId)
  const proposalCreatedAt = proposal?.blockTimestamp ?? 0
  const proposalVotingRoundId = proposal?.blockID ?? 1
  const standardProposalInDevelopmentStartDate = proposalInDevelopmentEvent?.[0]?.timestamp
  const standardProposalCompletedTimestamp = proposalCompletedEvent?.[0]?.timestamp
  const isGrant = proposal?.type === ProposalType.Grant
  ///Scenario 1: Grant completed
  // support -> approval -> in development -> completed
  // Scenario 2: Grant defeated
  // support -> approval -> Cancelled
  // Scenario 4: Grant cancelled
  // support -> cancelled
  // Scenario 5: Grant deposit not met
  // support -> cancelled
  //==============================================================
  // Scenario 3: Grant in development
  // support -> approval -> in development
  // Scenario 6: Grant rejected
  // support -> approval -> in development -> cancelled

  const timelineDates = useMemo(() => {
    return {
      supportStartDate: proposalCreatedAt * 1000,
      supportEndDate: supportEndDate,
      votingEndDate: votingEndDate,
      // Standard proposal only
      inDevelopmentStartDate: standardProposalInDevelopmentStartDate,
      completedTimestamp: standardProposalCompletedTimestamp,
      hasValidDates: hasValidDates,
      isLoading: isLoading,
    }
  }, [
    proposalCreatedAt,
    supportEndDate,
    votingEndDate,
    standardProposalInDevelopmentStartDate,
    standardProposalCompletedTimestamp,
    hasValidDates,
    isLoading,
  ])

  const grantTimelineSteps = useMemo(() => {
    //If the grant is cancelled but not rejected, means that it should jump straight from base step (Support phase) to the cancelled step
    //Scenario 4: Grant cancelled
    if (proposal?.state === ProposalState.Canceled && !isGrantRejected) {
      return [
        {
          label: t("Cancelled"),
          state: [ProposalState.Canceled],
        },
      ]
    }
    //If the grant is deposit not met, means that it should keep in the base step (Support phase)
    //Scenario 5: Grant deposit not met
    if (proposal?.state === ProposalState.DepositNotMet) {
      return [
        {
          label: t("Cancelled"),
          state: [ProposalState.DepositNotMet],
        },
      ]
    }
    //If the grant is defeated, means that it should jump straight from base step (Approval phase) to the cancelled step
    //Scenario 2: Grant defeated
    if (proposal?.state === ProposalState.Defeated) {
      return [
        {
          label: t("Approval phase"),
          state: [ProposalState.Active],
          description: timelineDates.hasValidDates
            ? t("Round #{{roundId}}: {{dateString}}", {
                roundId: Number(proposalVotingRoundId),
                dateString: `${dayjs(timelineDates.supportEndDate).format("MMM D, YYYY")} - ${dayjs(timelineDates.votingEndDate).format("MMM D, YYYY")}`,
              })
            : "---",
        },
        {
          label: t("Cancelled"),
          state: [ProposalState.Defeated],
        },
      ]
    }
    //Scenario 1, 3 and 6
    return [
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
      {
        label: t("In development"),
        state: [ProposalState.InDevelopment, ProposalState.Executed, ProposalState.Queued],
        description: timelineDates.hasValidDates ? dayjs(timelineDates.votingEndDate).format("MMM D, YYYY") : "---",
      },
      {
        label: isGrantRejected ? t("Cancelled") : t("Completed"),
        state: [ProposalState.Completed, ProposalState.Canceled],
      },
    ]
  }, [
    proposal,
    timelineDates.hasValidDates,
    timelineDates.supportEndDate,
    timelineDates.votingEndDate,
    proposalVotingRoundId,
    isGrantRejected,
  ])

  const proposalTimelineSteps = useMemo(() => {
    //If the proposal is cancelled, means that it should jump straight to the cancelled step from the base step (Support phase)
    //Scenario 4: Proposal cancelled
    if (proposal?.state === ProposalState.Canceled) {
      return [
        {
          label: t("Cancelled"),
          state: [ProposalState.Canceled],
        },
      ]
    }
    //If the proposal is deposit not met, means that it should keep in the base step (Support phase)
    //Scenario 5: Proposal deposit not met
    if (proposal?.state === ProposalState.DepositNotMet) {
      return [
        {
          label: t("Cancelled"),
          state: [ProposalState.DepositNotMet],
        },
      ]
    }
    //If the proposal is defeated, means that it should jump straight from base step (Approval phase) to the cancelled step
    //Scenario 2: Proposal defeated
    if (proposal?.state === ProposalState.Defeated) {
      return [
        {
          label: t("Approval phase"),
          state: [ProposalState.Active],
          description: timelineDates.hasValidDates
            ? t("Round #{{roundId}}: {{dateString}}", {
                roundId: Number(proposalVotingRoundId),
                dateString: `${dayjs(timelineDates.supportEndDate).format("MMM D, YYYY")} - ${dayjs(timelineDates.votingEndDate).format("MMM D, YYYY")}`,
              })
            : "---",
        },
        {
          label: t("Cancelled"),
          state: [ProposalState.Defeated],
        },
      ]
    }
    //Scenario 1, 3 and 6
    return [
      {
        label: t("Approval phase"),
        state: [ProposalState.Active, ProposalState.Succeeded, ProposalState.Queued, ProposalState.Executed],
        description: timelineDates.hasValidDates
          ? t("Round #{{roundId}}: {{dateString}}", {
              roundId: Number(proposalVotingRoundId),
              dateString: `${dayjs(timelineDates.supportEndDate).format("MMM D, YYYY")} - ${dayjs(timelineDates.votingEndDate).format("MMM D, YYYY")}`,
            })
          : "",
      },
      {
        label: t("In development"),
        state: [ProposalState.InDevelopment],
        description: timelineDates.inDevelopmentStartDate
          ? dayjs(timelineDates.inDevelopmentStartDate).format("MMM D, YYYY")
          : "",
      },
      {
        label: t("Completed"),
        state: [ProposalState.Completed],
        description: timelineDates.completedTimestamp
          ? dayjs(timelineDates.completedTimestamp).format("MMM D, YYYY")
          : "",
      },
    ]
  }, [
    proposal?.state,
    timelineDates.hasValidDates,
    timelineDates.supportEndDate,
    timelineDates.votingEndDate,
    timelineDates.inDevelopmentStartDate,
    timelineDates.completedTimestamp,
    proposalVotingRoundId,
  ])

  const timelineSteps: TimelineStep[] = useMemo(
    () => [
      {
        label: t("Created"),
        state: ["Created"],
        description: t("Round #{{roundId}}: {{dateString}}", {
          roundId: Number(proposalVotingRoundId) - 1,
          dateString: dayjs(timelineDates.supportStartDate).format("MMM D, YYYY"),
        }),
      },
      {
        label: t("Support phase"),
        state: [ProposalState.Pending],
        description: t("Round #{{roundId}}: {{dateString}}", {
          roundId: Number(proposalVotingRoundId) - 1,
          dateString: dayjs(timelineDates.supportStartDate).format("MMM D, YYYY"),
        }),
      },

      ...(isGrant ? grantTimelineSteps : proposalTimelineSteps),
    ],
    [proposalVotingRoundId, timelineDates.supportStartDate, isGrant, grantTimelineSteps, proposalTimelineSteps],
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

    const stepIndex = timelineSteps.findIndex(step => step.state.includes(proposal.state as ProposalState | "Created"))
    return stepIndex >= 0 ? stepIndex : 0
  }, [proposal, timelineSteps])

  return (
    <Card.Root variant="primary" w="full" p="6" gap={0}>
      <Card.Header>
        <HStack gap={2}>
          <Icon as={Calendar} boxSize={5} />
          <Heading size="xl" fontWeight="bold">
            {t("Timeline")}
          </Heading>
        </HStack>
      </Card.Header>
      <Card.Body asChild>
        <Steps.Root
          orientation="vertical"
          defaultStep={0}
          count={timelineSteps.length}
          size="sm"
          w="full"
          step={currentStep}
          colorPalette={invalidState ? "red" : "blue"}
          variant="primary">
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
                  <Text textStyle="sm" color={currentStep === index ? "text.strong" : "text.subtle"}>
                    {step.label}
                  </Text>
                  <Text textStyle="xs" color="text.subtle">
                    {step.description}
                  </Text>
                </VStack>
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>
      </Card.Body>
    </Card.Root>
  )
}
