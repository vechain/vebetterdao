import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"

import { useEvents } from "@/hooks/useEvents"

const abi = XAllocationPool__factory.abi
const contractAddress = getConfig().xAllocationPoolContractAddress

export const useAllocationPoolEvents = ({ appId = "", limit = 10 }: { appId?: string; limit?: number }) =>
  useEvents({
    abi,
    contractAddress,
    eventName: "AllocationRewardsClaimed",
    filterParams: { appId: appId as `0x${string}` },
    select: events => events.map(event => event.decodedData.args),
    order: "desc",
    limit,
    enabled: !!appId,
  })
