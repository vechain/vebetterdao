import { getAllMilestoneStates } from "@/hooks/proposals/grants/getAllMilestoneStates"
import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { Circle, Heading, HStack, Steps, Text, VStack } from "@chakra-ui/react"
import { UilCheck } from "@iconscout/react-unicons"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { MilestonesActionsItem } from "./MilestonesActionsItem"

export const MilestonesActions = ({ proposal }: { proposal?: GrantProposalEnriched }) => {
  const { t } = useTranslation()

  const states = getAllMilestoneStates(proposal)
  const steps = useMemo(
    () =>
      states.map((state, i) => {
        const milestone = proposal?.milestones?.[i]
        return {
          body: milestone ? (
            <MilestonesActionsItem
              key={i}
              index={i}
              state={state}
              milestone={milestone}
              proposalId={proposal?.id ?? ""}
            />
          ) : (
            <HStack key={i}>
              <Text>{t("Milestones are unavailable yet")}</Text>
            </HStack>
          ),
        }
      }),
    [proposal?.id, proposal?.milestones, states, t],
  )

  const isAllMilestoneCompleted = states.every(s => s === "Claimed")
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

  const [step, setStep] = useState(0)

  useEffect(() => {
    const pendingIndex = states.findIndex(s => s === "Pending")
    if (isAllMilestoneCompleted) {
      setStep(displaySteps.length)
    } else {
      setStep(pendingIndex >= 0 ? pendingIndex : Math.max(0, steps.length - 1))
    }
  }, [states, isAllMilestoneCompleted, displaySteps.length, steps.length])

  return (
    <Steps.Root
      orientation="vertical"
      defaultStep={0}
      count={displaySteps.length}
      size="sm"
      w="full"
      step={step}
      onStepChange={e => setStep(e.step)}
      variant="primaryVertical">
      <VStack w="full">
        <Steps.List w="full">
          {displaySteps.map((item, index) => (
            <Steps.Item key={index} index={index} w="full">
              <Steps.Indicator>
                <Steps.Status
                  incomplete={<Circle bg="#E2E8F0" boxSize="10px" />}
                  complete={
                    <Circle bg="#004CFC" boxSize="16px" color="white">
                      <UilCheck size="10" />
                    </Circle>
                  }
                  current={<Circle bg="#004CFC" boxSize="16px" />}
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
