import {
  Circle,
  Heading,
  Step,
  StepIcon,
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
import { useCurrentProposal } from "@/api"
import dayjs from "dayjs"

export const ProposalTimeline = () => {
  const { proposal } = useCurrentProposal()
  const steps = useMemo(
    () => [
      () => <ProposalCreatedTimelineItem />,
      () => (
        <TimelineItem
          title={t("Waiting for the round to start")}
          description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
        />
      ),
      () => (
        <TimelineItem
          title={t("Voting session started")}
          description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
        />
      ),
      () => (
        <TimelineItem
          title={t("Voting session ended")}
          description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
        />
      ),
      () => (
        <TimelineItem
          title={t("Proposal on queue")}
          description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
        />
      ),
      () => (
        <TimelineItem
          title={t("Proposal executed")}
          description={dayjs(proposal.votingStartDate).format("MMM D, YYYY")}
        />
      ),
    ],
    [proposal.votingStartDate],
  )
  const currentStep = 0
  const { activeStep } = useSteps({
    index: currentStep,
    count: steps.length,
  })

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
            {step()}
            <StepSeparator />
          </Step>
        ))}
      </Stepper>
    </VStack>
  )
}
