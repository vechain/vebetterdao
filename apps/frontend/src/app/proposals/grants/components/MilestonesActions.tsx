import { VStack, Steps, Circle, HStack, Text } from "@chakra-ui/react"
import { useMemo, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { UilCheck } from "@iconscout/react-unicons"
import { getAllMilestoneStates } from "@/hooks/proposals/grants/getAllMilestoneStates"
import { useProposalEnrichedById } from "@/hooks/proposals/common/useProposalEnrichedById"
import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { MilestonesActionsItem } from "./MilestonesActionsItem"

export const MilestonesActions = ({ proposalId }: { proposalId: string }) => {
  const { t } = useTranslation()
  const proposal = useProposalEnrichedById(proposalId) as GrantProposalEnriched

  const states = getAllMilestoneStates(proposal)
  const steps = useMemo(
    () =>
      states.map((state, i) => {
        const milestone = proposal.milestones[i]
        return {
          state,
          body: milestone ? (
            <MilestonesActionsItem key={i} index={i} state={state} milestone={milestone} proposalId={proposal.id} />
          ) : (
            <HStack key={i}>
              <Text>{t("Milestones are unavailable yet")}</Text>
            </HStack>
          ),
        }
      }),
    [states, proposal.id, proposal.milestones],
  )

  const [step, setStep] = useState(0)
  useEffect(() => {
    const pendingIndex = states.findIndex(s => s === "Pending")
    const allClaimedOrApproved = states.every(s => s === "Claimed")

    if (pendingIndex === -1 && !allClaimedOrApproved) {
      setStep(steps.length - 1)
    } else {
      setStep(allClaimedOrApproved ? steps.length : pendingIndex)
    }
  }, [states])

  return (
    <VStack gap={4} align="flex-start" w="full" p={4}>
      <Steps.Root
        orientation="vertical"
        defaultStep={0}
        count={steps.length}
        size="sm"
        step={step}
        onStepChange={e => setStep(e.step)}
        variant="primaryVertical">
        <VStack>
          <Steps.List>
            {steps.map((step, index) => (
              <Steps.Item key={index} index={index}>
                <Steps.Indicator>
                  <Steps.Status
                    incomplete={<Circle bg="#004CFC" size="0%" />}
                    complete={
                      <Circle bg="#004CFC" size="50%">
                        <UilCheck color="white" />
                      </Circle>
                    }
                    current={<Circle bg="#004CFC" size="50%" />}
                  />
                </Steps.Indicator>
                <VStack align="flex-start" gap={4}>
                  {step.body}
                </VStack>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>

          <Steps.CompletedContent>
            <VStack align="flex-start" gap={3} pt={2}>
              <HStack>
                <Circle bg="#004CFC" size="28px">
                  <UilCheck color="white" />
                </Circle>
                <Text fontWeight="semibold">{t("All milestones completed")}</Text>
              </HStack>
            </VStack>
          </Steps.CompletedContent>
        </VStack>
      </Steps.Root>
    </VStack>
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
