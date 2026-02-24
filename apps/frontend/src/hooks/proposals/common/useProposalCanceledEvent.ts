import { getConfig } from "@repo/config"
import { useMemo } from "react"

import { useEvents } from "../../useEvents"

const b3trGovernorAddress = getConfig().b3trGovernorAddress

const abi = [
  {
    type: "event",
    name: "ProposalCanceledWithReason",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "canceler", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const

export const useProposalCanceledEvent = (proposalId: string) => {
  const result = useEvents({
    abi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCanceledWithReason",
    select: events =>
      events.map(response => ({
        id: response.decodedData.args.proposalId.toString(),
        canceler: response.decodedData.args.canceler as string,
        reason: response.decodedData.args.reason as string,
        blockNumber: response.meta.blockNumber,
        txOrigin: response.meta.txOrigin,
        timestamp: response?.meta?.blockTimestamp ? response.meta.blockTimestamp * 1000 : 0,
      })),
  })

  const filteredData = useMemo(() => {
    if (!proposalId || !result.data) {
      return []
    }
    return result.data.filter(event => event.id === proposalId)
  }, [result.data, proposalId])

  if (!proposalId) {
    return {
      data: [],
      isLoading: false,
      error: null,
    }
  }

  return {
    ...result,
    data: filteredData,
  }
}
