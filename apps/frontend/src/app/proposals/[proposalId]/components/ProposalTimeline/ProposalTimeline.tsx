import { ProposalEnriched, GrantProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { Button, Heading, Steps, Circle, Card } from "@chakra-ui/react"
import { t } from "i18next"
import { useMemo, useState, useEffect } from "react"
// import { useWallet } from "@vechain/vechain-kit"
// import { useAccountPermissions } from "@/api/contracts/account"
import { TimelineElements } from "./TimelineElements"

type Props = {
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalTimeline = ({ proposal }: Props) => {
  // const { account } = useWallet()
  // const { data: permissions } = useAccountPermissions(account?.address || "")

  //   const height = useMemo(() => {
  //     return steps.length * 80
  //   }, [steps])

  const invalidState = useMemo(() => {
    return (
      proposal?.state === ProposalState.Defeated ||
      proposal?.state === ProposalState.Canceled ||
      proposal?.state === ProposalState.DepositNotMet
      // If it is a grant, proposa.State == GrantState
      // proposal?.state === ProposalState.Rejected
    )
  }, [proposal?.state])

  const steps = useMemo(() => {
    return [
      {
        key: 0,
        state: ProposalState.Pending,
        round: proposal?.votingRoundId,
        startDate: proposal?.createdAt,
        endDate: proposal?.createdAt, // round ID to date ( to get beggining and end of the round)
      },
      {
        key: 1,
        state: ProposalState.Active,
        round: proposal?.votingRoundId,
        startDate: proposal?.createdAt,
        endDate: proposal?.createdAt,
      },
      {
        key: 2,
        state:
          proposal?.state === ProposalState.Defeated
            ? ProposalState.Defeated
            : proposal?.state === ProposalState.Canceled
              ? ProposalState.Canceled
              : ProposalState.Succeeded,
        round: proposal?.votingRoundId,
        startDate: proposal?.createdAt,
        endDate: proposal?.createdAt,
      },
      ...(proposal?.state !== ProposalState.Defeated && proposal?.state !== ProposalState.Canceled
        ? [
            // If the grant got rejected, the proposal is rejected ( GrantState.Rejected )
            {
              key: 3,
              state: ProposalState.InDevelopment,
              round: proposal?.votingRoundId,
              startDate: proposal?.createdAt,
              endDate: proposal?.createdAt,
            },
            {
              key: 4,
              state: ProposalState.Completed,
              round: proposal?.votingRoundId,
              startDate: proposal?.createdAt,
              endDate: proposal?.createdAt,
            },
          ]
        : []),
    ]
  }, [proposal])

  const [activeStep, setActiveStep] = useState(1) // the active step by default is the support phase ( once created, it's directly in support phase)
  useEffect(() => {
    setActiveStep(1)
  }, [proposal?.state])

  // Check if the proposal is queuable and executable
  // only if the targets > 0
  const isQueuable = useMemo(() => {
    return proposal?.state === ProposalState.Succeeded
  }, [proposal?.state])

  const isExecutable = useMemo(() => {
    return proposal?.state === ProposalState.Active
  }, [proposal?.state])

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
            size="sm"
            count={steps.length}
            orientation="vertical"
            w="full"
            gap="0"
            step={activeStep}
            onStepChange={e => setActiveStep(e.step)}
            colorPalette={invalidState ? "red" : "blue"}
            variant="primaryVertical">
            <Steps.List>
              {steps.map((step, index) => (
                <Steps.Item key={`proposal-timeline-step-${step.key}`} index={index}>
                  <Steps.Indicator>
                    <Steps.Status
                      incomplete={<Circle bg={invalidState ? "#DC2626" : "actions.primary.default"} boxSize="0" />}
                      complete={<Circle bg={invalidState ? "#DC2626" : "actions.primary.default"} boxSize="50%" />}
                      current={<Circle bg={invalidState ? "#DC2626" : "actions.primary.default"} boxSize="50%" />}
                    />
                  </Steps.Indicator>
                  <TimelineElements
                    state={step.state}
                    round={step.round}
                    startDate={step?.startDate ?? 0} //TODO: Fix this fallback
                    endDate={step?.endDate ?? 0}
                  />
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
