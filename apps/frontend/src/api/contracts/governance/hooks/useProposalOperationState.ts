import { getConfig } from "@repo/config"
import { TimeLock__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { useProposalOperationId } from "./useProposalOperationId"
import { useMemo } from "react"

export enum ProposalOperationState {
  Unset,
  Waiting,
  Ready,
  Done,
}

const address = getConfig().timelockContractAddress
const abi = TimeLock__factory.abi

export const getProposalOperationStateQueryKey = (operationId: string) => {
  return getCallClauseQueryKey<typeof abi>({
    address,
    method: "getOperationState",
    args: [operationId as `0x${string}`],
  })
}

export const getProposalOperationTimestampQueryKey = (operationId: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method: "getTimestamp", args: [operationId as `0x${string}`] })
}

/**
 * Hook to get the state of a proposal operation (i.e. Waiting, Ready, Done)
 * @param proposalId  the proposal id to get the operation state for
 * @returns the proposal operation state
 */
export const useProposalOperationState = (proposalId?: string, enabled = true) => {
  const proposalOperationIdCall = useProposalOperationId(proposalId)
  const proposalOperationStateCall = useCallClause({
    abi,
    address,
    method: "getOperationState",
    args: [proposalOperationIdCall.data?.[0] as `0x${string}`],
    queryOptions: {
      enabled: !!proposalOperationIdCall.data?.[0] && !proposalOperationIdCall.isLoading && enabled,
    },
  })

  const isOperationWaiting = useMemo(
    () => Number(proposalOperationStateCall.data?.[0]) === ProposalOperationState.Waiting,
    [proposalOperationStateCall.data],
  )
  const isOperationReady = useMemo(
    () => Number(proposalOperationStateCall.data?.[0]) === ProposalOperationState.Ready,
    [proposalOperationStateCall.data],
  )
  const isOperationDone = useMemo(
    () => Number(proposalOperationStateCall.data?.[0]) === ProposalOperationState.Done,
    [proposalOperationStateCall.data],
  )

  const proposalOperationTimestampCall = useCallClause({
    abi,
    address,
    method: "getTimestamp",
    args: [proposalOperationIdCall.data?.[0] as `0x${string}`],
    queryOptions: {
      enabled: !proposalOperationIdCall.isLoading && enabled,
    },
  })

  return {
    proposalOperationId: proposalOperationIdCall.data?.[0],
    isLoading:
      proposalOperationStateCall.isLoading ||
      proposalOperationIdCall.isLoading ||
      proposalOperationTimestampCall.isLoading,
    operationState: proposalOperationStateCall.data?.[0],
    readyTimestamp: proposalOperationTimestampCall.data?.[0] ? Number(proposalOperationTimestampCall.data?.[0]) : 0,
    isOperationWaiting,
    isOperationReady,
    isOperationDone,
  }
}
