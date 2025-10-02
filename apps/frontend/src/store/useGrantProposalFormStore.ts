import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type GrantFormStoreState = GrantFormData & {
  currentStep: number
  setData: (data: Partial<GrantFormData>, currentStep?: number) => void
  setCurrentStep: (step: number) => void
  clearData: () => void
}

const initialState: GrantFormData = {
  grantType: "dapp",
  proposerAddress: "",
  // About project
  projectName: "",
  companyName: "",
  appTestnetUrl: "",
  projectWebsite: "",
  githubUsername: "",
  twitterUsername: "",
  discordUsername: "",
  discordUserId: "",
  // Project details
  problemDescription: "",
  solutionDescription: "",
  targetUsers: "",
  competitiveEdge: "",
  // Company details
  companyRegisteredNumber: "",
  projectIntro: "",
  teamOverview: "",
  companyLinkedin: "",
  companyEmail: "",
  companyTelegram: "",
  // Outcomes
  benefitsToUsers: "",
  benefitsToDApps: "",
  benefitsToVeChainEcosystem: "",
  x2EModel: "",
  revenueModel: "",
  highLevelRoadmap: "",
  // Milestones
  milestones: [
    {
      description: "",
      fundingAmount: 0,
      fundingAmountUsd: 0,
      durationFrom: 0,
      durationTo: 0,
    },
    {
      description: "",
      fundingAmount: 0,
      fundingAmountUsd: 0,
      durationFrom: 0,
      durationTo: 0,
    },
    {
      description: "",
      fundingAmount: 0,
      fundingAmountUsd: 0,
      durationFrom: 0,
      durationTo: 0,
    },
  ],
  termsOfService: false,
  // Voting round ID
  votingRoundId: "",

  grantsReceiverAddress: "",
}

export const GRANT_PROPOSAL_FORM_STORE_NAME = "GRANT_PROPOSAL_FORM_STORE"

/**
 * Store for the multi-step proposal form data
 */
export const useGrantProposalFormStore = create<GrantFormStoreState>()(
  devtools(
    persist(
      set => ({
        ...initialState,
        currentStep: 0,
        setData: (data: Partial<GrantFormData>, currentStep?: number) =>
          set(state => ({
            ...state,
            ...data,
            currentStep: currentStep ?? state.currentStep,
          })),
        setCurrentStep: (step: number) =>
          set(state => ({
            ...state,
            currentStep: step,
          })),
        clearData: () => set({ ...initialState, currentStep: 0 }),
      }),
      {
        name: GRANT_PROPOSAL_FORM_STORE_NAME,
      },
    ),
  ),
)

export const useDraftGrantProposalStore = create<{
  draftGrantProposals: GrantFormData[]
  addDraftGrantProposal: (draftGrantProposal: GrantFormData) => void
  removeDraftGrantProposal: (proposalId: string) => void
}>()(
  devtools(
    persist(
      (set, get) => ({
        draftGrantProposals: [] as GrantFormData[],
        addDraftGrantProposal: (draftGrantProposal: GrantFormData) =>
          set(state => ({
            draftGrantProposals: [
              draftGrantProposal,
              ...state.draftGrantProposals.filter(proposal => proposal.projectName !== draftGrantProposal.projectName),
            ],
          })),
        removeDraftGrantProposal: (projectName: string) =>
          set({
            draftGrantProposals: get().draftGrantProposals.filter(proposal => proposal.projectName !== projectName),
          }),
      }),
      {
        name: "DRAFT_GRANT_PROPOSAL_STORE",
      },
    ),
  ),
)
