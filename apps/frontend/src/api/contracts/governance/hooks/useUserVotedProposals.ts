import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useThor, useWallet, executeMultipleClausesCall } from "@vechain/vechain-kit"

import { useGetProposalsAndGrants } from "@/app/rounds/hooks/useRoundProposals"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress as `0x${string}`
const functionName = "hasVoted" as const

export const getUserVotedProposalsQueryKey = (address: string) => ["getUserVotedProposalsQuery", address]

export const useUserVotedProposals = (proposalIds: string[]) => {
  const thor = useThor()
  const { account } = useWallet()
  const { data: { proposals = [] } = {} } = useGetProposalsAndGrants()

  return useQuery({
    queryKey: getUserVotedProposalsQueryKey(account?.address ?? ""),
    queryFn: async () => {
      const hasVotedInRounds = await executeMultipleClausesCall({
        thor,
        calls: proposalIds.map(
          id =>
            ({
              abi,
              address: contractAddress,
              functionName,
              args: [id, account?.address as `0x${string}`],
            }) as const,
        ),
      })

      const proposalVoteStateMap = new Map(hasVotedInRounds.map((hasVoted, idx) => [proposalIds[idx], hasVoted]))

      return proposals.filter(proposal => proposalVoteStateMap.get(proposal.proposalId.toString()))
    },
    enabled: !!thor && !!account?.address && proposals?.length > 0 && proposalIds.length > 0,
  })
}
