import {
  buildCreateProposalTx,
  getActiveProposalsQueryKey,
  getIncomingProposalsQueryKey,
  getPastProposalsQueryKey,
  getProposalEvents,
} from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { governanceAvailableContracts } from "@/constants"

const config = getConfig()
type AvailableContractAbis = (typeof governanceAvailableContracts)[number]["abi"]["abi"][number]
/**
 * Represent a single parameter of the function to call in the smart contract
 * This is used to typing the inputs of the abi definition
 */
export type FunctionParamsField = { id: string; name: string; type: string; internalType: string; value: any }
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

type useCreateProposalReturnValue = {
  sendTransaction: (description?: string, actions?: ProposalAction[]) => Promise<void>
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
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
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

      await queryClient.cancelQueries({
        queryKey: getActiveProposalsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getActiveProposalsQueryKey(),
      })

      await queryClient.cancelQueries({
        queryKey: getIncomingProposalsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getIncomingProposalsQueryKey(),
      })

      await queryClient.cancelQueries({
        queryKey: getPastProposalsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getPastProposalsQueryKey(),
      })
      //TODO: refetch the proposals
    }

    toast({
      title: "Proposal created",
      description: `Your proposal has been created successfully`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  const buildClauses = useCallback(
    (description: string, actions: ProposalAction[]) => {
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
          result.functionsParams.push(obj.functionParams.map(param => param.value))
          return result
        },
        { contractsAbi: [], contractsAddress: [], functionsParams: [] } as ReducedActions,
      )

      const createProposalClause = buildCreateProposalTx(
        thor,
        res.contractsAbi,
        res.contractsAddress,
        res.functionsParams,
        description,
      )

      //   const delegateClause = buildDelegateVot3Tx(thor, account)

      return [createProposalClause]
    },
    [thor, account],
  )

  const onMutate = useCallback(
    async (description?: string, actions?: ProposalAction[]) => {
      if (!description) throw new Error("description is required")
      if (!actions) throw new Error("actions is required")

      const clauses = buildClauses(description, actions)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}
