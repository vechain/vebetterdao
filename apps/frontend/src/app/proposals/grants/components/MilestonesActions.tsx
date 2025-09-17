import { useAllMilestoneStates } from "@/hooks/proposals/grants/useAllMilestoneStates"
import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { Text } from "@chakra-ui/react"

export const MilestonesActions = ({ proposal }: { proposal?: GrantProposalEnriched }) => {
  const { data: milestoneStatesData } = useAllMilestoneStates(proposal)

  return <Text>{JSON.stringify(milestoneStatesData)}</Text>
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
