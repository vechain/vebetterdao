import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NavigatorFormData = {
  // Step 1: Why
  motivation: string
  qualifications: string
  votingStrategy: string

  // Step 2: Disclosures
  isAppAffiliated: boolean
  affiliatedAppNames: string
  isFoundationMember: boolean
  foundationRole: string
  hasConflictsOfInterest: boolean
  conflictsDescription: string

  // Step 3: Socials
  twitterHandle: string
  discordHandle: string
  websiteUrl: string
  otherLinks: string

  // Step 4: Stake
  stakeAmount: string
  ackVotingSlash: boolean
  ackReportSlash: boolean
  ackDisclosureSlash: boolean
}

type NavigatorApplicationStore = {
  data: NavigatorFormData
  currentStep: number
  setData: (partial: Partial<NavigatorFormData>) => void
  setCurrentStep: (step: number) => void
  clearData: () => void
}

const initialData: NavigatorFormData = {
  motivation: "",
  qualifications: "",
  votingStrategy: "",
  isAppAffiliated: false,
  affiliatedAppNames: "",
  isFoundationMember: false,
  foundationRole: "",
  hasConflictsOfInterest: false,
  conflictsDescription: "",
  twitterHandle: "",
  discordHandle: "",
  websiteUrl: "",
  otherLinks: "",
  stakeAmount: "",
  ackVotingSlash: false,
  ackReportSlash: false,
  ackDisclosureSlash: false,
}

export const useNavigatorApplicationStore = create<NavigatorApplicationStore>()(
  persist(
    set => ({
      data: initialData,
      currentStep: 0,
      setData: partial => set(state => ({ data: { ...state.data, ...partial } })),
      setCurrentStep: step => set({ currentStep: step }),
      clearData: () => set({ data: initialData, currentStep: 0 }),
    }),
    { name: "NAVIGATOR_APPLICATION_STORE" },
  ),
)
