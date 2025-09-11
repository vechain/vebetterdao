import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import dayjs from "dayjs"

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
      durationFrom: dayjs().add(1, "day").unix(),
      durationTo: dayjs().add(1, "month").unix(),
    },
    {
      description: "",
      fundingAmount: 0,
      durationFrom: dayjs().add(2, "month").unix(),
      durationTo: dayjs().add(3, "month").unix(),
    },
    {
      description: "",
      fundingAmount: 0,
      durationFrom: dayjs().add(4, "month").unix(),
      durationTo: dayjs().add(5, "month").unix(),
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
