import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"

import { getEventsKey, useEvents } from "@/hooks/useEvents"

const abi = NavigatorRegistry__factory.abi
const contractAddress = getConfig().navigatorRegistryContractAddress as `0x${string}`
const eventName = "ProposalDecisionSet" as const

export const getNavigatorDecisionEventsKey = (navigator?: string) =>
  getEventsKey({ eventName, filterParams: { navigator } })

export const useNavigatorDecisionEvents = (navigator?: string) => {
  return useEvents({
    abi,
    contractAddress,
    eventName,
    filterParams: { navigator: (navigator ?? "") as `0x${string}` },
    select: events =>
      events.map(({ decodedData }) => ({
        navigator: decodedData.args.navigator,
        proposalId: decodedData.args.proposalId.toString(),
        decision: Number(decodedData.args.decision),
      })),
    enabled: !!navigator,
  })
}
