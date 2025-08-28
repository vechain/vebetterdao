import { Heading, Steps, Circle, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { useMemo } from "react"
import { TimelineItem } from "./components/TimelineItem"
import { ProposalState } from "@/api"
import dayjs from "dayjs"
import { useWallet } from "@vechain/vechain-kit"
import { useAccountPermissions } from "@/api/contracts/account"
import { ProposalQueueButton } from "./components/ProposalQueueButton"
import { ProposalExecuteButton } from "./components/ProposalExecuteButton"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { ProposalCreatedTimelineItem } from "./components/ProposalCreatedTimeLineItem"

export const ProposalTimeline = () => {
  const { proposal } = useProposalDetail()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address || "")

  const showQueueButton = proposal.state === ProposalState.Succeeded && permissions?.isProposalExecutor
  const showExecuteButton = proposal.state === ProposalState.Queued && permissions?.isProposalExecutor

  const isCanceled = useMemo(() => proposal.state === ProposalState.Canceled, [proposal.state])

  const activeStep = useMemo(() => {
    if (proposal.state === ProposalState.Pending) {
      return proposal.isDepositReached ? 1 : 0
    }
    if (proposal.state === ProposalState.DepositNotMet) {
      return 0
    }
    if (proposal.state === ProposalState.Active) {
      return 2
    }
    if (
      proposal.state === ProposalState.Canceled ||
      proposal.state === ProposalState.Defeated ||
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

  const steps = useMemo(
    () =>
      isCanceled
        ? [
            <ProposalCreatedTimelineItem key={0} />,
            <TimelineItem key={1} title={t("Waiting for the round to start")} />,
            <TimelineItem
              key={3}
              title={t("Proposal canceled!")}
              description={proposal.proposalCanceledDate?.format("MMM D, YYYY")}
            />,
          ]
        : [
            <ProposalCreatedTimelineItem key={0} />,
            <TimelineItem key={1} title={t("Waiting for the round to start")} />,
            <TimelineItem
              key={2}
              title={activeStep >= 2 ? t("Voting session started") : t("Voting session starts")}
              description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
            />,
            <TimelineItem
              key={3}
              title={activeStep > 3 ? t("Voting session ended") : t("Voting session ends")}
              description={dayjs(proposal.votingEndDate).format("MMM D, YYYY")}
            />,
            ...(proposal.type === "on-chain"
              ? [
                  <TimelineItem
                    key={4}
                    title={t("Proposal on queue")}
                    description={
                      proposal.proposalQueuedDate ? dayjs(proposal.proposalQueuedDate).format("MMM D, YYYY") : ""
                    }
                    actionButton={showQueueButton && <ProposalQueueButton />}
                  />,
                  <TimelineItem
                    key={5}
                    title={t("Proposal executed")}
                    description={
                      proposal.proposalExecutedDate ? dayjs(proposal.proposalExecutedDate).format("MMM D, YYYY") : ""
                    }
                    actionButton={showExecuteButton && <ProposalExecuteButton />}
                  />,
                ]
              : []),
          ],
    [proposal, showExecuteButton, showQueueButton, activeStep, isCanceled],
  )

  const height = useMemo(() => {
    return steps.length * 80
  }, [steps])

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="xl">{t("Timeline")}</Heading>
      <Steps.Root
        size="sm"
        step={activeStep}
        orientation="vertical"
        w="full"
        height={height}
        gap="0"
        variant="primaryVertical">
        <Steps.List flex={1}>
          {steps.map((step, index) => (
            <Steps.Item key={`proposal-timeline-step-${step.key}`} index={index} style={{ width: "100%" }}>
              <Steps.Indicator>
                <Steps.Status
                  incomplete={<Circle bg="#004CFC" size="0" />}
                  complete={<Circle bg="#004CFC" size="30%" />}
                  current={<Circle bg="#004CFC" size="50%" />}
                />
              </Steps.Indicator>
              {step}
              <Steps.Separator />
            </Steps.Item>
          ))}
        </Steps.List>
      </Steps.Root>
    </VStack>
  )
}
