import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useMemo } from "react"

import { useEvents } from "../../useEvents"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi

export const useProposalInDevelopmentEvent = (proposalId: string) => {
  const result = useEvents({
    abi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalInDevelopment",
    select: events =>
      events.map(response => ({
        id: response.decodedData.args.proposalId.toString(),
        blockNumber: response.meta.blockNumber,
        txOrigin: response.meta.txOrigin,
        timestamp: response?.meta?.blockTimestamp ? response.meta.blockTimestamp * 1000 : 0,
      })),
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
