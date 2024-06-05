import { getConfig } from "@repo/config"
import { TimeLock__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { useProposalOperationId } from "./useProposalOperationId"
import { useMemo } from "react"

export enum ProposalOperationState {
  Unset,
  Waiting,
  Ready,
  Done,
}

const contractAddress = getConfig().timelockContractAddress
const contractInterface = TimeLock__factory.createInterface()

export const getProposalOperationStateQueryKey = (operationId: string) => {
  getCallKey({ method: "getOperationState", keyArgs: [operationId] })
}

export const getProposalOperationTimestampQueryKey = (operationId: string) => {
  getCallKey({ method: "getTimestamp", keyArgs: [operationId] })
}

export const useProposalOperationState = (proposalId?: string, enabled = true) => {
  const proposalOperationIdCall = useProposalOperationId(proposalId)
  const proposalOperationStateCall = useCall({
    contractInterface,
    contractAddress,
    method: "getOperationState",
    args: [proposalOperationIdCall.data],
    enabled: !!proposalOperationIdCall.data && !proposalOperationIdCall.isLoading && enabled,
  })

  const isOperationWaiting = useMemo(
    () => Number(proposalOperationStateCall.data) === ProposalOperationState.Waiting,
    [proposalOperationStateCall.data],
  )
  const isOperationReady = useMemo(
    () => Number(proposalOperationStateCall.data) === ProposalOperationState.Ready,
    [proposalOperationStateCall.data],
  )
  const isOperationDone = useMemo(
    () => Number(proposalOperationStateCall.data) === ProposalOperationState.Done,
    [proposalOperationStateCall.data],
  )

  const proposalOperationTimestampCall = useCall({
    contractInterface,
    contractAddress,
    method: "getTimestamp",
    args: [proposalOperationIdCall.data],
    enabled: !proposalOperationIdCall.isLoading && enabled,
  })

  return {
    proposalOperationId: proposalOperationIdCall.data,
    isLoading:
      proposalOperationStateCall.isLoading ||
      proposalOperationIdCall.isLoading ||
      proposalOperationTimestampCall.isLoading,
    operationState: proposalOperationStateCall.data,
    readyTimestamp: proposalOperationTimestampCall.data || 0,
    isOperationWaiting,
    isOperationReady,
    isOperationDone,
  }
}
