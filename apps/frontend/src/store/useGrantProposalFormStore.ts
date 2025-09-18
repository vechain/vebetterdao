import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type GrantFormStoreState = GrantFormData & {
  setData: (data: Partial<GrantFormStoreState>) => void
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
  // Project details
  problemDescription: "",
  solutionDescription: "",
  targetUsers: "",
  competitiveEdge: "",
  // Company details
  companyRegisteredNumber: "",
  companyIntro: "",
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

/**
 * Store for the multi-step proposal form data
 */
export const useGrantProposalFormStore = create<GrantFormStoreState>()(
  devtools(
    persist(
      set => ({
        ...initialState,
        setData: (data: Partial<GrantFormStoreState>) =>
          set(state => ({
            ...state,
            ...data,
          })),
        clearData: () => set(initialState),
      }),
      {
        name: "GRANT_PROPOSAL_FORM_STORE",
      },
    ),
  ),
)
