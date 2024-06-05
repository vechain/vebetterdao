import {
  Circle,
  Heading,
  Step,
  StepIndicator,
  StepSeparator,
  StepStatus,
  Stepper,
  VStack,
  useSteps,
} from "@chakra-ui/react"
import { t } from "i18next"
import { useMemo } from "react"
import { TimelineItem } from "./components/TimelineItem"
import { ProposalCreatedTimelineItem } from "./components/ProposalCreatedTimelineItem"
import { ProposalState, useCurrentProposal } from "@/api"
import dayjs from "dayjs"
import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountPermissions } from "@/api/contracts/account"
import { ProposalQueueButton } from "./components/ProposalQueueButton"
import { ProposalExecuteButton } from "./components/ProposalExecuteButton"

export const ProposalTimeline = () => {
  const { proposal } = useCurrentProposal()
  const { account } = useWallet()
  const { isProposalExecutor } = useAccountPermissions(account || "")

  const showQueueButton = proposal.state === ProposalState.Succeeded && isProposalExecutor
  const showExecuteButton = proposal.state === ProposalState.Queued && isProposalExecutor
  const steps = useMemo(
    () => [
      <ProposalCreatedTimelineItem key={0} />,
      <TimelineItem key={1} title={t("Waiting for the round to start")} />,
      <TimelineItem
        key={2}
        title={t("Voting session started")}
        description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
      />,
      <TimelineItem
        key={3}
        title={t("Voting session ended")}
        description={dayjs(proposal.votingEndDate).format("MMM D, YYYY")}
      />,
      <TimelineItem
        key={4}
        title={t("Proposal on queue")}
        description={proposal.proposalQueuedDate ? dayjs(proposal.proposalQueuedDate).format("MMM D, YYYY") : ""}
        actionButton={showQueueButton && <ProposalQueueButton />}
      />,
      <TimelineItem
        key={5}
        title={t("Proposal executed")}
        description={proposal.proposalExecutedDate ? dayjs(proposal.proposalExecutedDate).format("MMM D, YYYY") : ""}
        actionButton={showExecuteButton && <ProposalExecuteButton />}
      />,
    ],
    [
      proposal.proposalExecutedDate,
      proposal.proposalQueuedDate,
      proposal.votingEndDate,
      proposal.votingStartDate,
      showExecuteButton,
      showQueueButton,
    ],
  )
  const activeStep = useMemo(() => {
    if (proposal.state === ProposalState.Pending) {
      return proposal.isDepositReached ? 1 : 0
    }
    if (proposal.state === ProposalState.Active) {
      return 2
    }
    if (
      proposal.state === ProposalState.Canceled ||
      proposal.state === ProposalState.Defeated ||
      proposal.state === ProposalState.DepositNotMet ||
      proposal.state === ProposalState.Expired ||
      proposal.state === ProposalState.Succeeded
    ) {
      return 3
    }
    if (proposal.state === ProposalState.Queued) {
      return 4
    }
    if (proposal.state === ProposalState.Executed) {
      return 5
    }
    return 0
  }, [proposal.isDepositReached, proposal.state])

  return (
    <VStack align="stretch" gap={6}>
      <Heading fontSize={"20px"} fontWeight={700}>
        {t("Timeline")}
      </Heading>
      <Stepper index={activeStep} orientation="vertical" height="400px" gap="0" variant="primaryVertical">
        {steps.map((step, index) => (
          <Step key={index} style={{ width: "100%" }}>
            <StepIndicator>
              <StepStatus
                complete={<Circle bg="#004CFC" size={"30%"} />}
                active={<Circle bg="#004CFC" size={"60%"} />}
              />
            </StepIndicator>
            {step}
            <StepSeparator />
          </Step>
        ))}
      </Stepper>
    </VStack>
  )
}
