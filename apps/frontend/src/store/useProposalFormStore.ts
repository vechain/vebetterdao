import { GovernanceProposalTemplate, GovernanceFeaturedFunction } from "@/constants"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type ProposalFormAction = GovernanceFeaturedFunction & {
  contractAddress: string
  calldata?: string
}
export type ProposalFormStoreState = {
  title?: string
  shortDescription?: string
  markdownDescription?: string
  actions: ProposalFormAction[]
  votingStartRoundId?: number
  depositAmount?: number
  metadataUri?: string
  setData: (data: Partial<ProposalFormStoreState>) => void
  clearData: () => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useProposalFormStore = create<ProposalFormStoreState>()(
  devtools(
    persist(
      set => ({
        title: undefined,
        shortDescription: undefined,
        markdownDescription: GovernanceProposalTemplate,
        actions: [],
        votingStartRoundId: undefined,
        metadataUri: undefined,
        setData: (data: Partial<ProposalFormStoreState>) =>
          set(state => ({
            ...state,
            ...data,
          })),
        clearData: () =>
          set({
            title: undefined,
            shortDescription: undefined,
            markdownDescription: GovernanceProposalTemplate,
            actions: [],
            votingStartRoundId: undefined,
            metadataUri: undefined,
          }),
      }),
      {
        name: "PROPOSAL_FORM_STORE",
      },
    ),
  ),
)
