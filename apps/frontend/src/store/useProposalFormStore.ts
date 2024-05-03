import { abi } from "thor-devkit"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

const stepVariant = {
  1: "stepOne",
  2: "stepTwo",
}

export type ProposalFormStoreState = {
  title?: string
  shortDescription?: string
  markdownDescription?: string
  actions: {
    contractAddress: string
    calldata?: string
    abiDefinition: abi.Function.Definition
    functionName?: string
    functionDescription?: string
  }[]
  votingStartRoundId?: number
  depositAmount?: number
  setData: (data: Partial<ProposalFormStoreState>) => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useProposalFormStore = create<ProposalFormStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        title: undefined,
        shortDescription: undefined,
        markdownDescription: undefined,
        actions: [],
        votingStartRoundId: undefined,
        setData: (data: Partial<ProposalFormStoreState>) =>
          set(state => ({
            ...state,
            ...data,
          })),
      }),
      {
        name: "PROPOSAL_FORM_STORE",
      },
    ),
  ),
)
