import { GrantProposalEnriched, Milestone, MilestoneState } from "./types"
import { useMilestoneState } from "./useMilestoneState"

export const getAllMilestoneStates = (proposal?: GrantProposalEnriched) => {
  if (!proposal) return []
  const milestones = proposal.milestones

  const milestoneStates = milestones.map((_milestone: Milestone, index: number) => {
    const states = useMilestoneState({ proposalId: proposal.id, milestoneIndex: index }).data?.state

    switch (states) {
      case MilestoneState.Claimed:
        return "Claimed"
      case MilestoneState.Rejected:
        return "Rejected"
      case MilestoneState.Approved:
        return "Approved"
    }
    return "Pending"
  })

  return milestoneStates
}
