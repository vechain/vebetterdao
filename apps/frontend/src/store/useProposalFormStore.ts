import { ProposalAction } from "@/hooks"
import { abi } from "thor-devkit"
import create from "zustand"
import { devtools, persist } from "zustand/middleware"

const stepVariant = {
  1: "stepOne",
  2: "stepTwo",
}

type StepOneData = {
  description: string
  actions: {
    contractAddress: string
    calldata: string
    abi: abi.Function
  }[]
}

type StepTwoData = {
  votingSessionRoundId: string | number
}

type setDataType = { step: 1; data: StepOneData } | { step: 2; data: StepTwoData }

type State = {
  stepOne: StepOneData | null
  stepTwo: StepTwoData | null
  setData: ({ step, data }: setDataType) => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useProposalFormStore = create<State>()(
  devtools(
    persist(
      (set, get) => ({
        stepOne: null,
        stepTwo: null,
        stepThree: null,
        setData: ({ step, data }) =>
          set(state => ({
            ...state,
            [stepVariant[step]]: data,
          })),
      }),
      {
        name: "PROPOSAL_FORM_STORE",
      },
    ),
  ),
)
