import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { GrantFormData } from "@/hooks/proposals/grants/types"

export type GrantFormStoreState = GrantFormData & {
  setData: (data: Partial<GrantFormStoreState>) => void
  clearData: () => void
}

const initialState: GrantFormData = {
  grantType: "",
  // About applicant
  applicantName: "",
  applicantSurname: "",
  applicantRole: "",
  applicantProfileUrl: "",
  applicantCountry: "",
  applicantCity: "",
  applicantStreet: "",
  applicantPostalCode: "",
  applicantBackground: "",
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
  // Outcomes
  benefitsToUsers: "",
  benefitsToDApps: "",
  benefitsToVeChainEcosystem: "",
  x2EModel: "",
  revenueModel: "",
  highLevelRoadmap: "",
  // Milestones
  milestones: [],
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
