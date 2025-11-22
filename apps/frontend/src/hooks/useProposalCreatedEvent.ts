import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useThor } from "@vechain/vechain-kit"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

export const useProposalCreatedEvent = (proposalId: bigint) => {
  const thor = useThor()

  return useQuery({
    queryKey: [""],
    queryFn: () =>
      fetchContractEvents({
        thor,
        abi,
        contractAddress: address,
        eventName: "ProposalCreated" as const,
        filterParams: [proposalId],
        mapResponse: ({ meta, decodedData }) => ({ ...meta, ...decodedData.args }),
      }),
    select: data => data[0],
  })
}
