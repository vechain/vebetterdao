import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useMemo } from "react"

import { useEvents } from "../../useEvents"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
export const useProposalCompletedEvent = (proposalId: string) => {
  const result = useEvents({
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCompleted",
    abi,
    mapResponse: response => ({
      id: response.decodedData.args.proposalId.toString(),
      blockNumber: response.meta.blockNumber,
      txOrigin: response.meta.txOrigin,
      timestamp: response?.meta?.blockTimestamp ? response.meta.blockTimestamp * 1000 : 0,
    }),
  })

  // Filter client-side by proposalId
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
