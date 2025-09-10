/* eslint-disable react/no-array-index-key */
import { getAllMilestoneStates } from "@/hooks/proposals/grants/getAllMilestoneStates"
import { GrantProposalEnriched, MilestoneState } from "@/hooks/proposals/grants/types"
import { Circle, Heading, HStack, Steps, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { MilestonesActionsItem } from "./MilestonesActionsItem"

export const MilestonesActions = ({ proposal }: { proposal?: GrantProposalEnriched }) => {
  const { t } = useTranslation()

  const states = getAllMilestoneStates(proposal)
  const steps = useMemo(
    () =>
      states.map((state, index) => {
        const milestone = proposal?.milestones?.[index]
        const stepKey = `proposal-${proposal?.id}-milestones-actions-step-${index}`
        return {
          key: stepKey,
          body: milestone ? (
            <MilestonesActionsItem
              key={stepKey}
              index={index}
              state={state}
              milestone={milestone}
              proposalId={proposal?.id ?? ""}
              grantsReceiver={proposal?.grantsReceiverAddress ?? ""}
            />
          ) : (
            <HStack key={`${stepKey}-unavailable`}>
              <Text>{t("Milestones are unavailable yet")}</Text>
            </HStack>
          ),
        }
      }),
    [proposal?.grantsReceiverAddress, proposal?.id, proposal?.milestones, states, t],
  )

  const isAllMilestoneCompleted = states.every(milestoneState => milestoneState === MilestoneState.Claimed)
  const displaySteps = useMemo(() => {
    const base = steps
    if (!isAllMilestoneCompleted) return base

    return [
      ...base,
      {
        body: (
          <HStack>
            <Heading size="md" fontWeight="semibold">
              {t("Grant Completed")}
            </Heading>
          </HStack>
        ),
        _isCompletion: true as const,
      },
    ] as ((typeof steps)[number] & { _isCompletion?: true })[]
  }, [steps, isAllMilestoneCompleted, t])

  const currentStep = useMemo(() => {
    //Get the index of the first pending milestone
    const pendingIndex = states.findIndex(milestoneState => milestoneState === MilestoneState.Pending)
    //If all milestones are completed, return the last step
    if (isAllMilestoneCompleted) return displaySteps.length
    //If there is a pending milestone, return the index of the first pending milestone
    //If there is no pending milestone, return the index of the last step
    return pendingIndex >= 0 ? pendingIndex : Math.max(0, steps.length - 1)
  }, [states, isAllMilestoneCompleted, displaySteps.length, steps.length])

  return (
    <Steps.Root
      orientation="vertical"
      defaultStep={0}
      count={displaySteps.length}
      size="sm"
      w="full"
      step={currentStep}
      variant="primaryVertical">
      <VStack w="full">
        <Steps.List w="full">
          {displaySteps.map((item, index) => (
            <Steps.Item key={`step-${item.key}`} index={index} w="full">
              <Steps.Indicator>
                <Steps.Status
                  incomplete={<Circle bg="actions.primary.default" size="0" />}
                  complete={<Circle bg="actions.primary.default" size="40%" />}
                  current={<Circle bg="actions.primary.default" size="55%" />}
                />
              </Steps.Indicator>

              <VStack align="flex-start" gap={4} w="full">
                {item.body}
              </VStack>

              <Steps.Separator />
            </Steps.Item>
          ))}
        </Steps.List>
      </VStack>
    </Steps.Root>
  )
}
// TODO: Reject will be on the right side as cancel proposal
//   const handleRejectGrant = () => {
//     rejectGrant()
//   }
//   <Button variant="primaryAction" disabled={!permissions?.isGrantRejector} onClick={handleRejectGrant}>
//   {"Reject Grant"}
// </Button>
// const { sendTransaction: rejectGrant } = useRejectGrant({
//   proposalId: proposal.id,
//   onSuccess: () => {
//     queryClient.invalidateQueries({ queryKey: getProposalStateQueryKey(proposal.id) })
//   },
// })

//  <Button variant="primaryAction" disabled={!permissions?.isGrantRejector} onClick={handleRejectGrant}>
// {"Reject Grant"}
// </Button>
