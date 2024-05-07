import { buildCreateProposalTx, getProposalEvents } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { governanceAvailableContracts } from "@/constants"
import { ethers } from "ethers"
export type AvailableContractAbis = (typeof governanceAvailableContracts)[number]["abi"]["abi"][number]
/**
 * Represent a single parameter of the function to call in the smart contract
 * This is used to typing the inputs of the abi definition
 */
export type FunctionParamsField = { id: string; name: string; type: string; internalType?: string; value: any }
/**
 * Represent a single action to be exeuted in case the proposal is successful
 * This is equal to a smart contract call to the given function with the given params
 */
export type ProposalAction = {
  contractAddress: string
  contractAbi?: AvailableContractAbis
  functionParams: FunctionParamsField[]
}
/**
 * Data required to create a proposal. Multiple actions could be provided in case we want multiple function to be executed
 */
export type useCreateProposalProps = {
  invalidateCache?: boolean
  onSuccess?: () => void
}

type BuildClausesProps = {
  description: string
  actions: ProposalAction[]
  startRoundId: number | string
}

type useCreateProposalReturnValue = {
  sendTransaction: (props: BuildClausesProps) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * Hook to create a proposal with the given calldata or actions. I.e functions to call if the proposal is executed
 * @param description The description of the proposal
 * @param actions the functions we want to execute in case the proposal is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useCreateProposal = ({
  invalidateCache = true,
  onSuccess,
}: useCreateProposalProps): useCreateProposalReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getProposalEvents(),
      })
      await queryClient.refetchQueries({
        queryKey: getProposalEvents(),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  const buildClauses = useCallback(
    ({ description, actions, startRoundId }: BuildClausesProps) => {
      if (!account) throw new Error("Account is required")
      type ReducedActions = {
        contractsAbi: AvailableContractAbis[]
        contractsAddress: string[]
        functionsParams: (string | number)[][]
      }
      // Using Array.reduce to map objects into separate arrays based on keys
      const res: ReducedActions = actions.reduce(
        (result, obj) => {
          if (!obj.contractAbi) throw new Error("contractAbi is required")
          result.contractsAbi.push(obj.contractAbi)
          result.contractsAddress.push(obj.contractAddress)
          // parse values if needed
          result.functionsParams.push(
            obj.functionParams.map(param => {
              if (param.type === "bytes32") return ethers.encodeBytes32String(param.value)
              return param.value
            }),
          )
          return result
        },
        { contractsAbi: [], contractsAddress: [], functionsParams: [] } as ReducedActions,
      )

      const createProposalClauses = buildCreateProposalTx(
        res.contractsAbi,
        res.contractsAddress,
        res.functionsParams,
        description,
        startRoundId,
      )

      return createProposalClauses
    },
    [account],
  )

  const onMutate = useCallback(
    async (data: BuildClausesProps) => {
      if (!data.description) throw new Error("description is required")
      if (!data.actions) throw new Error("actions is required")

      const clauses = buildClauses(data)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}
