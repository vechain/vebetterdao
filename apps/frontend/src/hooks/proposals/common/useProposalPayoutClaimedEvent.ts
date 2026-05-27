import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useMemo } from "react"

import { useEvents } from "../../useEvents"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi

/**
 * V11: payout-claimed events from the Governor. Each emission represents one
 * registered payee pulling their B3TR from the Treasury after the proposal
 * was marked Completed.
 */
export const useProposalPayoutClaimedEvent = (proposalId: string) => {
  const result = useEvents({
    abi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalPayoutClaimed",
    select: events =>
      events.map(response => ({
        id: response.decodedData.args.proposalId.toString(),
        payeeIndex: Number(response.decodedData.args.payeeIndex),
        account: response.decodedData.args.account as string,
        amount: BigInt(response.decodedData.args.amount),
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
