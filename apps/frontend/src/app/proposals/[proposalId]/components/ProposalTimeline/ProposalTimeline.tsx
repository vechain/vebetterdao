import { ProposalEnriched, GrantProposalEnriched, ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { Button, Heading, Steps, Card, VStack, Text, Circle } from "@chakra-ui/react"
import { t } from "i18next"
import { useMemo } from "react"
import { useProposalInteractionDates } from "@/api"
import dayjs from "dayjs"

type Props = {
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalTimeline = ({ proposal }: Props) => {
  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal?.id ?? "")

  const proposalCreatedAt = proposal?.createdAt ?? 0
  const proposalVotingRoundId = proposal?.votingRoundId ?? 1
  const isGrant = proposal?.type === ProposalType.Grant
  const hasActions = Array.isArray(proposal?.values) && proposal?.values.length > 0

  const timelineSteps = useMemo(
    () => [
      {
        label: t("Support phase"),
        state: [ProposalState.Pending],
        description: t("Round #{{roundId}}: {{dateString}}", {
          roundId: Number(proposalVotingRoundId) - 1,
          dateString: dayjs(proposalCreatedAt * 1000).format("MMM D, YYYY"),
        }),
      },
      {
        label: t("Approval phase"),
        state: [ProposalState.Active, ProposalState.Succeeded],
        description: t("Round #{{roundId}}: {{dateString}}", {
          roundId: Number(proposalVotingRoundId),
          dateString: `${dayjs(supportEndDate).format("MMM D, YYYY")} - ${dayjs(votingEndDate).format("MMM D, YYYY")}`,
        }),
      },
      ...(hasActions
        ? [
            {
              label: isGrant ? t("In development") : t("Executed"),
              state: [ProposalState.InDevelopment, ProposalState.Executed, ProposalState.Queued],
              description: dayjs(votingEndDate).format("MMM D, YYYY"),
            },
          ]
        : []),
      {
        label: t("Completed"),
        state: [ProposalState.Completed],
        description: "Project completed successfully",
      },
    ],
    [proposal?.votingRoundId, proposal?.createdAt],
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

  // Check if the proposal is queuable and executable
  const isQueuable = useMemo(() => {
    return proposal?.state === ProposalState.Succeeded
  }, [proposal?.state])

  const isExecutable = useMemo(() => {
    return proposal?.state === ProposalState.Active
  }, [proposal?.state])

  const stepIndicatorBg = useMemo(() => {
    return "actions.primary.default"
    //TODO: Change it to dynamic color based on the state
    // return invalidState ? "error.primary" : "actions.primary.default"
  }, [invalidState])

  return (
    <>
      <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"}>
        <Card.Header>
          <Heading fontSize={"20px"} fontWeight={700}>
            {t("Timeline")}
          </Heading>
        </Card.Header>
        <Card.Body>
          <Steps.Root
            orientation="vertical"
            defaultStep={0}
            count={timelineSteps.length}
            size="sm"
            w="full"
            step={currentStep}
            colorPalette={invalidState ? "red" : "blue"}
            variant="primaryVertical">
            <Steps.List>
              {timelineSteps.map((step, index) => (
                <Steps.Item key={`timeline-step-${step.state}`} index={index} minH={20}>
                  <Steps.Indicator>
                    <Steps.Status
                      incomplete={<Circle bg={stepIndicatorBg} size="0" />}
                      complete={<Circle bg={stepIndicatorBg} size="40%" />}
                      current={<Circle bg={stepIndicatorBg} size="55%" />}
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

      {/*  Temporary Card to show the admin actions ( Queue, Execute, Cancel) */}
      <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"}>
        <Card.Body>
          <Heading fontSize={"20px"} fontWeight={700}>
            {"ADMIN ACTIONS"}
          </Heading>
          <Button size="sm" variant="primaryAction" disabled={!isQueuable}>
            {"Queue"}
          </Button>
          <Button size="sm" variant="primaryAction" disabled={!isExecutable}>
            {"Execute"}
          </Button>
        </Card.Body>
      </Card.Root>
    </>
  )
}
