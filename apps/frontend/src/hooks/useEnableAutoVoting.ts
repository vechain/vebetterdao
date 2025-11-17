import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { useBuildTransaction } from "./useBuildTransaction"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

type ClausesProps = {
  roundId: string
  appIds: string[]
  voteWeights: bigint[]
  userAddress: string
}

type UseEnableAutoVotingAndVoteProps = {
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Hook to enable auto-voting with selected app preferences AND cast vote in current round
 * This combines all three operations:
 * 1. setUserVotingPreferences - to store the selected app IDs for future auto-voting
 * 2. toggleAutoVoting - to enable auto-voting for the user
 * 3. castVote - to cast vote in the current round with calculated weights
 */
export const useEnableAutoVotingAndVote = ({
  onSuccess,
  transactionModalCustomUI,
}: UseEnableAutoVotingAndVoteProps = {}) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ roundId, appIds, voteWeights, userAddress }: ClausesProps) => {
      const clauses: EnhancedClause[] = []

      // Set the user's voting preferences for future auto-voting
      clauses.push({
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("setUserVotingPreferences", [appIds]),
        comment: "Set voting preferences for auto-voting",
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("setUserVotingPreferences"))),
      })

      // Toggle auto-voting to enable it
      clauses.push({
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("toggleAutoVoting", [userAddress]),
        comment: "Enable auto-voting",
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("toggleAutoVoting"))),
      })

      // Cast vote for the current round
      clauses.push({
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("castVote", [roundId, appIds, voteWeights]),
        comment: `Cast your vote on round ${roundId}`,
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("castVote"))),
      })

      return clauses
    },
    [account?.address],
  )

  const refetchQueryKeys = useMemo(() => {
    // Add query keys that should be refetched after voting
    return []
  }, [account?.address])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
