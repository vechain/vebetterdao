// Zustand to save the selected filters for the proposals
import { create } from "zustand"

export enum ProposalFilter {
  State = "State",
  InThisRound = "In this round",
  LookingForSupport = "Looking for support",
  UpcomingVoting = "Upcoming voting",
  ApprovalPhase = "Approval phase",
  SupportPhase = "Support phase",
  StandardProposalCompleted = "Standard proposal completed",
  FailedStates = "Failed states",
  InDevelopment = "In development or queued",
}
export enum StateFilter {
  Canceled = "Canceled",
  Defeated = "Defeated",
  Succeeded = "Succeeded",
  Queued = "Queued",
  Executed = "Executed",
  DepositNotMet = "Support not reached",
  InDevelopment = "In development",
  Completed = "Completed",
  Pending = "Pending",
  Active = "Active",
}
interface ProposalFilterStoreState {
  selectedFilter: (ProposalFilter | StateFilter)[]
  setSelectedFilter: (filter: (ProposalFilter | StateFilter)[]) => void
  clearFilter: () => void
}
export const useProposalFilters = create<ProposalFilterStoreState>(set => ({
  selectedFilter: [],
  setSelectedFilter: filter => set({ selectedFilter: filter }),
  clearFilter: () => set({ selectedFilter: [] }),
}))
