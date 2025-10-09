import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { getParticipatedInGovernanceQueryKey } from "../api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { getXAppRoundEarningsQueryKey } from "../api/contracts/xAllocationPool/hooks/useXAppRoundEarnings"
import { getAllocationVotersQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationVoters"
import { getAllocationVotesQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationVotes"
import { getHasVotedInRoundQueryKey } from "../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { getUserVotesInRoundQueryKey } from "../api/contracts/xApps/hooks/useUserVotesInRound"
import { getXAppsSharesQueryKey } from "../api/contracts/xApps/hooks/useXAppShares"

import { useBuildTransaction } from "./useBuildTransaction"

//Extra 15% to mitigate low gas estimation when voting on a large number of apps
//Check https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1752523695772269
const GAS_PADDING = 0.15
/**
 * CastAllocationVotesProps is the type of the data to send to the castAllocationVotes hook
 * id is the id of the app to vote
 * value is the percentage of the vote (not scaled)
 */
export type CastAllocationVotesProps = {
  appId: string
  votes: number
}[]
type useCastAllocationVotesProps = {
  roundId: string
  onSuccess?: () => void
  onSuccessMessageTitle?: string
  transactionModalCustomUI?: TransactionCustomUI
}
const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()
/**
 * Hook to cast votes to one or more apps in a round
 * This hook will send a vote transaction to the blockchain and wait for the txConfirmation
 * @param roundId the id of the round to cast the votes
 * @param onSuccess callback to run when the upgrade is successful
 * @param transactionModalCustomUI custom UI for the transaction modal
 */
export const useCastAllocationVotes = ({
  roundId,
  onSuccess,
  transactionModalCustomUI,
}: useCastAllocationVotesProps) => {
  const { account } = useWallet()

  const buildClauses = useCallback(
    (data: CastAllocationVotesProps) => {
      const filteredData = data.filter(value => value.votes > 0)

      const apps = filteredData.map(value => value.appId)
      const votes = filteredData.map(value => ethers.parseEther(value.votes.toString()))

      const clause: EnhancedClause = {
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("castVote", [roundId, apps, votes]),
        comment: `Cast your vote on round ${roundId}`,
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("castVote"))),
      }

      return [clause]
    },
    [roundId],
  )

  const refetchQueryKeys = useMemo(() => {
    return [
      getAllocationVotesQueryKey(roundId),
      getAllocationVotersQueryKey(roundId),
      getXAppsSharesQueryKey(roundId),
      getUserVotesInRoundQueryKey(roundId, account?.address ?? ""),
      getHasVotedInRoundQueryKey(roundId, account?.address ?? undefined),
      getXAppRoundEarningsQueryKey(roundId),
      getParticipatedInGovernanceQueryKey(account?.address ?? ""),
    ]
  }, [roundId, account?.address])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    // @ts-ignore
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
    gasPadding: GAS_PADDING,
  })
}
