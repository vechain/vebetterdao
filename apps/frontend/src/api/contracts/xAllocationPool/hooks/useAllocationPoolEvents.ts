import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"

import { useEvents } from "@/hooks/useEvents"

const abi = XAllocationPool__factory.abi
const contractAddress = getConfig().xAllocationPoolContractAddress

export const useAllocationPoolEvents = ({ appId, limit = 10 }: { appId?: string; limit?: number }) =>
  useEvents({
    abi,
    contractAddress,
    eventName: "AllocationRewardsClaimed",
    filterParams: [appId],
    select: events => events.map(event => event.decodedData.args),
    limit,
    enabled: !!appId,
  })
