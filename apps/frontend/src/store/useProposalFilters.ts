// Zustand to save the selected filters for the proposals

import { create } from "zustand"

export enum ProposalFilter {
  State = "State",
  InThisRound = "In this round",
  LookingForSupport = "Looking for support",
  UpcomingVoting = "Upcoming voting",
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

export const initialProposalsFilterValues = [
  ProposalFilter.InThisRound,
  ProposalFilter.LookingForSupport,
  ProposalFilter.UpcomingVoting,
]

interface ProposalFilterStoreState {
  selectedFilter: (ProposalFilter | StateFilter)[]
  setSelectedFilter: (filter: (ProposalFilter | StateFilter)[]) => void
  clearFilter: () => void
}

export const useProposalFilters = create<ProposalFilterStoreState>(set => ({
  selectedFilter: initialProposalsFilterValues,
  setSelectedFilter: filter => set({ selectedFilter: filter }),
  clearFilter: () => set({ selectedFilter: initialProposalsFilterValues }),
}))
