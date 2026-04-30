import { getConfig } from "@repo/config"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useThor } from "@vechain/vechain-kit"

import { fetchContractEvents } from "../fetchContractEvents"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress
const PAGE_SIZE = 5

export const useProposalVoteEvents = ({
  proposalId,
  voter,
  page = 0,
  order = "asc",
}: {
  proposalId: string
  voter?: `0x${string}`
  page?: number
  order?: "asc" | "desc"
}) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["proposalVoteEvents", proposalId, voter, page, order],
    queryFn: () =>
      fetchContractEvents({
        thor,
        abi,
        contractAddress,
        eventName: "VoteCast",
        filterParams: { proposalId: BigInt(proposalId), voter },
        order,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    enabled: !!proposalId && !!thor,
  })
}
