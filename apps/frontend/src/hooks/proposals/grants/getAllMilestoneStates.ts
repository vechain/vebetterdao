import { FormattedProposalDetailData } from "@/app/proposals/[proposalId]/hooks/useProposalDetail"
import { useMilestoneState } from "./useMilestoneState"
import { GrantProposalEnriched, Milestone, MilestoneState } from "./types"

export const getAllMilestoneStates = (proposal: GrantProposalEnriched & FormattedProposalDetailData) => {
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
